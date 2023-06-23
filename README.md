# Log Routing Service

This project is a simple, yet powerful, log routing service that is capable of receiving logs over HTTP and routing these logs to a SQL database. It's designed to help monitor user behavior and system operations.

## Architecture and Design Decisions

The architecture is based on Docker, with each service running in a separate container on a shared network for simplified orchestration and isolation. The main components are the application service, the database service, and a testing service. 

### Application Service

The application service receives logs through an HTTP endpoint (`POST /log`). Each log is a JSON object that represents an event, such as a user login or logout.

To handle the potential influx of up to 100k writes per second, the service buffers incoming logs instead of writing to the database immediately upon receipt. Once the buffer file size exceeds 10MB or when 30 seconds have elapsed since the last write, the data is written to the database in a batch. This strategy optimizes performance and reduces the write load on the database.

### Database Service

For this project, we have chosen to use a MySQL database, but the design is flexible enough to support any SQL database. The database is containerized for ease of deployment, environment consistency, and isolation from the application service.

### Test Service

The test service sends requests at a rate of 1k requests/second to the log server. This helps us test the system's performance under heavy load. The testing service is also containerized to ensure consistent performance across different environments.

## Running the Project

Use Docker Compose to run this project:

- To start all services: `docker-compose up`

- To start the test service: `docker-compose -f docker-compose.test.yml up`

Please note that you may need to adjust the services' configurations to match your specific environment.

## Future Enhancements

While the current system serves as a good baseline, there are several improvements we could consider for the future:

- Use a more resilient buffering strategy to mitigate the risk of data loss from using a local file system buffer. This might involve using a distributed cache or a message queuing service.
- Implement different strategies for writing to the database, such as using database-specific bulk insert operations.
- Integrate a monitoring and alerting system to get real-time insights about the system's status and performance.
- Integrate with a CI/CD system to automate the build, test, and deployment processes.