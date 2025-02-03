# Realtime Web Application

A web application that includes real-time web technologies such as WebSocket and Webhook, On a public server.

The idea behind the application is that you should be able to list github issues from a GitLab repository. The web application is a Node.js application that uses Express as the application framework. 

After cloning the repository with the application's source code and running the `npm install` command, it is easy to lint the source code and run the application using start and lint.

## The web application

<img src=".readme/application.png" width="80%" alt="application" />

The image above explains the web application's architecture.

The application returns the HTTP status code 404 (Not Found). The HTTP status code 500 (Internal Server Error) must only be returned when necessary. As far as possible, the application is protected from vulnerable attacks.
