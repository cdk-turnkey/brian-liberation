import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigw from "@aws-cdk/aws-apigateway";
import * as s3 from "@aws-cdk/aws-s3";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as origins from "@aws-cdk/aws-cloudfront-origins";
import * as ssm from "@aws-cdk/aws-ssm";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as cognito from "@aws-cdk/aws-cognito";
const stackname = require("@cdk-turnkey/stackname");
const crypto = require("crypto");
import { Effect, PolicyStatement } from "@aws-cdk/aws-iam";
import * as acm from "@aws-cdk/aws-certificatemanager";
import * as route53 from "@aws-cdk/aws-route53";
import * as targets from "@aws-cdk/aws-route53-targets";
import * as cloudtrail from "@aws-cdk/aws-cloudtrail";
import * as athena from "@aws-cdk/aws-athena";
import * as glue from "@aws-cdk/aws-glue";
import { RemovalPolicy } from "@aws-cdk/core";
const schema = require("../backend/schema");

export interface MadLiberationWebappProps extends cdk.StackProps {
  fromAddress?: string;
  domainName?: string;
  zoneId?: string;
  facebookAppId?: string;
  facebookAppSecret?: string;
  amazonClientId?: string;
  amazonClientSecret?: string;
  googleClientId?: string;
  googleClientSecret?: string;
}

export class MadliberationWebapp extends cdk.Stack {
  constructor(
    scope: cdk.App,
    id: string,
    props: MadLiberationWebappProps = {}
  ) {
    super(scope, id, props);

    const {
      fromAddress,
      domainName,
      zoneId,
      facebookAppId,
      facebookAppSecret,
      amazonClientId,
      amazonClientSecret,
      googleClientId,
      googleClientSecret,
    } = props;

    console.log("schema.PARTITION_KEY:");
    console.log(schema.PARTITION_KEY);

    const sedersTable = new dynamodb.Table(this, "SedersTable", {
      partitionKey: {
        name: schema.PARTITION_KEY,
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: schema.SORT_KEY, type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    sedersTable.addGlobalSecondaryIndex({
      indexName: schema.SCRIPTS_INDEX,
      partitionKey: {
        name: schema.SCRIPTS_PART_KEY,
        type: dynamodb.AttributeType.NUMBER,
      },
      nonKeyAttributes: [
        schema.HAGGADAH_DESCRIPTION,
        schema.HAGGADAH_NAME,
        schema.SORT_KEY,
        schema.PARTITION_KEY,
        schema.HAGGADAH_SHORT_DESC,
        schema.PATH,
      ],
      projectionType: dynamodb.ProjectionType.INCLUDE,
      sortKey: {
        name: schema.SCRIPT_NUMBER,
        type: dynamodb.AttributeType.NUMBER,
      },
    });
    sedersTable.addGlobalSecondaryIndex({
      indexName: schema.EMAIL_PATH_INDEX,
      partitionKey: {
        name: schema.USER_EMAIL,
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: schema.PATH,
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    sedersTable.addGlobalSecondaryIndex({
      indexName: schema.EMAIL_GAME_NAME_INDEX,
      partitionKey: {
        name: schema.USER_EMAIL,
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: schema.GAME_NAME,
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const frontendLogBucket = new s3.Bucket(this, "FrontendLogBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    const frontendBucket = new s3.Bucket(this, "FrontendBucket", {
      serverAccessLogsBucket: frontendLogBucket,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    const nonCFLogBucket = new s3.Bucket(this, "NonCFLogBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    const nonCFBucket = new s3.Bucket(this, "NonCFBucket", {
      serverAccessLogsBucket: nonCFLogBucket,
      accessControl: s3.BucketAccessControl.PUBLIC_READ,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // This is so a script can find the bucket and deploy to it.
    // I can't wrap up the artifact at cdk-deploy time, because the CDK Level-3
    // construct for doing so is still (last I checked) experimental
    const frontendBucketNameParam = new ssm.StringParameter(
      this,
      "FrontendBucketNameParam",
      {
        description: "The name of the bucket where front-end assets go",
        parameterName: stackname("FrontendBucketName"),
        stringValue: frontendBucket.bucketName,
        tier: ssm.ParameterTier.STANDARD,
        type: ssm.ParameterType.STRING,
      }
    );

    const nonCFBucketNameParam = new ssm.StringParameter(
      this,
      "NonCFBucketNameParam",
      {
        description:
          "The name of the non-CloudFront bucket where front-end assets go",
        parameterName: stackname("NonCFBucketName"),
        stringValue: nonCFBucket.bucketName,
        tier: ssm.ParameterTier.STANDARD,
        type: ssm.ParameterType.STRING,
      }
    );

    let hostedZone, wwwDomainName, certificate, domainNames;
    if (domainName && zoneId) {
      hostedZone = route53.HostedZone.fromHostedZoneAttributes(
        this,
        "HostedZone",
        { hostedZoneId: zoneId, zoneName: domainName + "." }
      );
      wwwDomainName = "www." + domainName;
      certificate = new acm.Certificate(this, "Certificate", {
        domainName,
        subjectAlternativeNames: [wwwDomainName],
        validation: acm.CertificateValidation.fromDns(hostedZone),
      });
      domainNames = [domainName, wwwDomainName];
    }

    const distroProps: any = {
      logBucket: new s3.Bucket(this, "DistroLoggingBucket", {
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }),
      logFilePrefix: "distribution-access-logs/",
      logIncludesCookies: true,
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      },
      defaultRootObject: "index.html",
      domainNames,
      certificate,
    };

    const distro = new cloudfront.Distribution(this, "Distro", distroProps);

    const userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: "Brian Liberation: verify your new account",
        emailStyle: cognito.VerificationEmailStyle.LINK,
      },
      signInAliases: { username: false, email: true, phone: false },
      autoVerify: { email: true, phone: false },
      mfa: cognito.Mfa.OPTIONAL,
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      passwordPolicy: {
        requireDigits: false,
        requireLowercase: false,
        requireSymbols: false,
        requireUppercase: false,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        nickname: {
          required: true,
          mutable: true,
        },
      },
    });
    let cfnUserPool;
    if (fromAddress) {
      cfnUserPool = userPool.node.defaultChild as cognito.CfnUserPool;
      cfnUserPool.emailConfiguration = {
        emailSendingAccount: "DEVELOPER",
        from: `Mad Liberation Verification <${fromAddress}>`,
        sourceArn:
          // SES integration is only available in us-east-1, us-west-2, eu-west-1
          `arn:aws:ses:${this.region}` +
          `:${this.account}:identity/` +
          `${fromAddress}`,
      };
    }
    const clientWriteAttributes =
      new cognito.ClientAttributes().withStandardAttributes({
        nickname: true,
        email: true,
      });
    const clientReadAttributes = clientWriteAttributes.withStandardAttributes({
      emailVerified: true,
    });
    const webappDomainName = domainName || distro.distributionDomainName;

    if (facebookAppId && facebookAppSecret) {
      const userPoolIdentityProviderFacebook =
        new cognito.UserPoolIdentityProviderFacebook(this, "Facebook", {
          clientId: facebookAppId,
          clientSecret: facebookAppSecret,
          userPool,
          scopes: ["public_profile", "email"],
          /*
          > Apps may ask for the following two permissions from any person
          > without submitting for review by Facebook:
          > 
          > public profile
          > email

          https://developers.facebook.com/docs/facebook-login/overview
          */
          attributeMapping: {
            nickname: cognito.ProviderAttribute.FACEBOOK_NAME,
            email: cognito.ProviderAttribute.FACEBOOK_EMAIL,
          },
        });
      userPool.registerIdentityProvider(userPoolIdentityProviderFacebook);
    }
    if (amazonClientId && amazonClientSecret) {
      const userPoolIdentityProviderAmazon =
        new cognito.UserPoolIdentityProviderAmazon(this, "Amazon", {
          clientId: amazonClientId,
          clientSecret: amazonClientSecret,
          userPool,
          attributeMapping: {
            nickname: cognito.ProviderAttribute.AMAZON_NAME,
            email: cognito.ProviderAttribute.AMAZON_EMAIL,
          },
        });
      userPool.registerIdentityProvider(userPoolIdentityProviderAmazon);
    }
    if (googleClientId && googleClientSecret) {
      const userPoolIdentityProviderGoogle =
        new cognito.UserPoolIdentityProviderGoogle(this, "Google", {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
          userPool,
          scopes: ["profile", "email"],
          attributeMapping: {
            nickname: cognito.ProviderAttribute.GOOGLE_NAME,
            email: cognito.ProviderAttribute.GOOGLE_EMAIL,
          },
        });
      userPool.registerIdentityProvider(userPoolIdentityProviderGoogle);
    }

    const userPoolClient = userPool.addClient("UserPoolClient", {
      generateSecret: true,
      oAuth: {
        callbackUrls: ["https://" + webappDomainName + "/prod/get-cookies"],
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.COGNITO_ADMIN,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        flows: {
          authorizationCodeGrant: true,
          clientCredentials: false,
          implicitCodeGrant: false,
        },
      },
      readAttributes: clientReadAttributes,
      writeAttributes: clientWriteAttributes,
    });

    const stacknameHash = crypto
      .createHash("sha256")
      .update(stackname(`udp`))
      .digest("hex")
      .toLowerCase()
      .slice(0, 20);
    const domainPrefix = stacknameHash + this.account;

    const userPoolDomain = userPool.addDomain("UserPoolDomain", {
      cognitoDomain: {
        domainPrefix: domainPrefix,
      },
    });

    const fn = new lambda.Function(this, "BackendHandler", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("backend"),
      memorySize: 3000,
      environment: {
        NODE_ENV: "production",
        TABLE_NAME: sedersTable.tableName,
        JWKS_URL:
          "https://cognito-idp." +
          this.region +
          ".amazonaws.com/" +
          userPool.userPoolId +
          "/.well-known/jwks.json",
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_DOMAIN: userPoolDomain.domainName,
        REDIRECT_URI: "https://" + webappDomainName + "/prod/get-cookies",
        REGION: this.region,
        IDP_URL:
          "https://" +
          userPoolDomain.domainName +
          ".auth." +
          this.region +
          ".amazoncognito.com/login?response_type=code&client_id=" +
          userPoolClient.userPoolClientId +
          "&redirect_uri=" +
          "https://" +
          webappDomainName +
          "/prod/get-cookies",
      },
      timeout: cdk.Duration.seconds(20),
    });

    sedersTable.grantReadWriteData(fn);

    fn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["cognito-idp:DescribeUserPoolClient"],
        resources: [
          `arn:aws:cognito-idp:${userPool.stack.region}:${userPool.stack.account}:userpool/${userPool.userPoolId}`,
        ],
      })
    );

    const lambdaApi = new apigw.LambdaRestApi(this, "Endpoint", {
      handler: fn,
    });

    const lambdaApiUrlConstructed =
      lambdaApi.restApiId +
      ".execute-api." +
      this.region +
      "." +
      this.urlSuffix;
    distro.addBehavior(
      "/prod/*",
      new origins.HttpOrigin(lambdaApiUrlConstructed, {
        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
      }),
      {
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: new cloudfront.OriginRequestPolicy(
          this,
          "BackendORP",
          {
            cookieBehavior: cloudfront.OriginRequestCookieBehavior.all(),
            queryStringBehavior:
              cloudfront.OriginRequestQueryStringBehavior.all(),
          }
        ),
      }
    );

    if (domainName && wwwDomainName && hostedZone) {
      // point the domain name with an alias record to the distro
      const aliasRecord = new route53.ARecord(this, "Alias", {
        recordName: domainName,
        zone: hostedZone,
        target: route53.RecordTarget.fromAlias(
          new targets.CloudFrontTarget(distro)
        ),
      });
      const aliasWWWRecord = new route53.ARecord(this, "AliasWWW", {
        recordName: wwwDomainName,
        zone: hostedZone,
        target: route53.RecordTarget.fromAlias(
          new targets.CloudFrontTarget(distro)
        ),
      });
      const DNS_WEIGHT = 100;
      const cfnAliasRecordSet = aliasRecord.node
        .defaultChild as route53.CfnRecordSet;
      cfnAliasRecordSet.weight = DNS_WEIGHT;
      cfnAliasRecordSet.setIdentifier = "mlwebapp-cf-alias";
      const cfnAliasWWWRecordSet = aliasWWWRecord.node
        .defaultChild as route53.CfnRecordSet;
      cfnAliasWWWRecordSet.weight = DNS_WEIGHT;
      cfnAliasWWWRecordSet.setIdentifier = "mlwebapp-www-cf-alias";
    }

    const scriptsBucket = new s3.Bucket(this, "ScriptsBucket", {
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    scriptsBucket.grantRead(fn);

    // Log some data events
    const trail = new cloudtrail.Trail(this, "CloudTrailBLib");
    trail.addS3EventSelector([
      { bucket: frontendBucket },
      { bucket: nonCFBucket },
    ]);
    const athenaOutputBucket = new s3.Bucket(this, "AthenaOutputBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    const athenaWorkGroupName = stackname("BLibWorkGroup");
    const athenaWorkGroup = new athena.CfnWorkGroup(this, "BLibWorkGroup", {
      name: athenaWorkGroupName,
      workGroupConfiguration: {
        resultConfiguration: {
          outputLocation: `s3://${athenaOutputBucket.bucketName}`,
        },
      },
    });
    const glueDBName = stackname("gluedb").toLowerCase();
    const glueDBLocationBucket = new s3.Bucket(this, "GlueDBLocationBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    const glueDB = new glue.Database(this, "BLibGlueDB", {
      databaseName: glueDBName,
      locationUri: `s3://${glueDBLocationBucket.bucketName}`,
    });

    const fromAddressOutput = fromAddress || "no SES from address";
    new cdk.CfnOutput(this, "sesFromAddress", {
      value: fromAddressOutput,
    });
    new cdk.CfnOutput(this, "webappDomainName", {
      value: webappDomainName || "no domain name specified",
    });
    new cdk.CfnOutput(this, "wwwDomainName", {
      value: wwwDomainName || "no www domain name",
    });
    new cdk.CfnOutput(this, "zoneId", {
      value: zoneId || "no zoneId specified",
    });
    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: distro.distributionDomainName,
    });
    new cdk.CfnOutput(this, "lambdaApi_url", {
      value: lambdaApi.url,
    });
    new cdk.CfnOutput(this, "FrontendBucketName", {
      value: frontendBucket.bucketName,
    });
    new cdk.CfnOutput(this, "FrontendBucketNameParamName", {
      value: frontendBucketNameParam.parameterName,
    });
    new cdk.CfnOutput(this, "FrontendLogBucketName", {
      value: frontendLogBucket.bucketName,
    });
    new cdk.CfnOutput(this, "NonCFBucketName", {
      value: nonCFBucket.bucketName,
    });
    new cdk.CfnOutput(this, "NonCFBucketNameParamName", {
      value: nonCFBucketNameParam.parameterName,
    });
    new cdk.CfnOutput(this, "NonCFLogBucketName", {
      value: nonCFLogBucket.bucketName,
    });
    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
    });
    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, "ScriptsBucketName", {
      value: scriptsBucket.bucketName,
    });
    new cdk.CfnOutput(this, "TableName", { value: sedersTable.tableName });
  }
}
