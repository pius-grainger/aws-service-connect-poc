# AWS Service Connect POC with ECS Fargate

This project demonstrates a proof of concept for AWS Service Connect with ECS Fargate. Service Connect simplifies service-to-service communication by providing service discovery and connection management.

## Project Structure

- `api-service/`: A simple API service that responds to HTTP requests
- `client-service/`: A client service that calls the API service
- `infrastructure/`: CloudFormation templates for deploying the services with Service Connect
- `docker-compose.yml`: For local testing

## Prerequisites

- AWS CLI configured with appropriate permissions
- Docker installed locally
- An AWS account with access to ECS, VPC, and related services

## Deployment Steps

1. Build and push Docker images
2. Deploy the CloudFormation stack
3. Test the service connectivity

See detailed instructions in each component's README.