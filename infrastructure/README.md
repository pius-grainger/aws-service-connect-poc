# AWS Service Connect Infrastructure

This directory contains CloudFormation templates for deploying the AWS Service Connect POC.

## Templates

- `main.yaml`: Creates the VPC, subnets, ECS cluster, and Service Connect namespace
- `services.yaml`: Deploys the Python API and client services with Service Connect configuration
- `services-node.yaml`: Deploys the Node.js API and client services with Service Connect configuration

## Deployment Instructions

### Python Services

1. Build and push the Docker images to Amazon ECR:

```bash
# Set up environment variables
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-east-1  # Change to your preferred region

# Create ECR repositories
aws ecr create-repository --repository-name service-connect-poc/api-service
aws ecr create-repository --repository-name service-connect-poc/client-service

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push images
docker build --platform linux/amd64 -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/service-connect-poc/api-service:latest ./api-service
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/service-connect-poc/api-service:latest

docker build --platform linux/amd64 -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/service-connect-poc/client-service:latest ./client-service
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/service-connect-poc/client-service:latest
```

2. Deploy the main infrastructure stack:

```bash
aws cloudformation create-stack \
  --stack-name ServiceConnectPOC \
  --template-body file://main.yaml \
  --capabilities CAPABILITY_IAM
```

3. Wait for the main stack to complete:

```bash
aws cloudformation wait stack-create-complete --stack-name ServiceConnectPOC
```

4. Deploy the services stack:

```bash
aws cloudformation create-stack \
  --stack-name ServiceConnectPOC-Services \
  --template-body file://services.yaml \
  --parameters \
    ParameterKey=MainStackName,ParameterValue=ServiceConnectPOC \
    ParameterKey=ApiServiceImageUri,ParameterValue=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/service-connect-poc/api-service:latest \
    ParameterKey=ClientServiceImageUri,ParameterValue=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/service-connect-poc/client-service:latest
```

### Node.js Services

1. Build and push the Docker images to Amazon ECR:

```bash
# Set up environment variables
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-east-1  # Change to your preferred region

# Create ECR repositories
aws ecr create-repository --repository-name service-connect-poc/api-service-node
aws ecr create-repository --repository-name service-connect-poc/client-service-node

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push images
docker build --platform linux/amd64 -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/service-connect-poc/api-service-node:latest ./api-service-node
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/service-connect-poc/api-service-node:latest

docker build --platform linux/amd64 -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/service-connect-poc/client-service-node:latest ./client-service-node
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/service-connect-poc/client-service-node:latest
```

2. Deploy the Node.js services stack (after deploying the main stack):

```bash
aws cloudformation create-stack \
  --stack-name ServiceConnectPOC-Services-Node \
  --template-body file://services-node.yaml \
  --parameters \
    ParameterKey=MainStackName,ParameterValue=ServiceConnectPOC \
    ParameterKey=ApiServiceImageUri,ParameterValue=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/service-connect-poc/api-service-node:latest \
    ParameterKey=ClientServiceImageUri,ParameterValue=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/service-connect-poc/client-service-node:latest \
  --capabilities CAPABILITY_IAM
```

## Testing the Deployment

### Testing Python Services

1. Get the public IP of the client service:

```bash
# Get the task ARN
TASK_ARN=$(aws ecs list-tasks --cluster ServiceConnectPOC-Cluster --service-name client-service --query 'taskArns[0]' --output text)

# Get the ENI ID
ENI_ID=$(aws ecs describe-tasks --cluster ServiceConnectPOC-Cluster --tasks $TASK_ARN --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text)

# Get the public IP
PUBLIC_IP=$(aws ec2 describe-network-interfaces --network-interface-ids $ENI_ID --query 'NetworkInterfaces[0].Association.PublicIp' --output text)

echo "Client service is available at: http://$PUBLIC_IP:8080"
```

2. Test the service connectivity:

```bash
# Test the client service directly
curl http://$PUBLIC_IP:8080/

# Test the client service calling the API service via Service Connect
curl http://$PUBLIC_IP:8080/call-api
```

### Testing Node.js Services

1. Get the public IP of the Node.js client service:

```bash
# Get the task ARN
TASK_ARN=$(aws ecs list-tasks --cluster ServiceConnectPOC-Cluster --service-name client-service-node --query 'taskArns[0]' --output text)

# Get the ENI ID
ENI_ID=$(aws ecs describe-tasks --cluster ServiceConnectPOC-Cluster --tasks $TASK_ARN --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text)

# Get the public IP
PUBLIC_IP=$(aws ec2 describe-network-interfaces --network-interface-ids $ENI_ID --query 'NetworkInterfaces[0].Association.PublicIp' --output text)

echo "Node.js client service is available at: http://$PUBLIC_IP:8080"
```

2. Test the service connectivity:

```bash
# Test the client service directly
curl http://$PUBLIC_IP:8080/

# Test the client service calling the API service via Service Connect
curl http://$PUBLIC_IP:8080/call-api
```

## Cleanup

To delete the stacks when you're done:

```bash
aws cloudformation delete-stack --stack-name ServiceConnectPOC-Services-Node
aws cloudformation wait stack-delete-complete --stack-name ServiceConnectPOC-Services-Node
aws cloudformation delete-stack --stack-name ServiceConnectPOC-Services
aws cloudformation wait stack-delete-complete --stack-name ServiceConnectPOC-Services
aws cloudformation delete-stack --stack-name ServiceConnectPOC
```