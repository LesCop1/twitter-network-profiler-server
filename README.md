# TNP Server
> **This is the Server of TNP.**
> 
[Demo](https://tnp.mathisengels.fr)

## TNP - Twitter Network Profiler
Twitter Network Profiler is a web app allowing you to see the relations around your target's Twitter account. It allows you, to see up to relations of depth 3, therefore a more global view around your target and learn more information about them. You have a lot of information on each found account, even their Instagram if available. 

## The Server
This repository is only the server which is the REST API allowing the client to work. The web app can't work without the server.

### Demo
You can access the demo [here](https://tnp.mathisengels.fr).

## Prerequisites
Before you begin, ensure you have met the following requirements:
- You have installed Node (LTS version). You can check if you have Node installed by typing:
```bash
$ node --version
v16.13.0
```

## Configuration
You only need to configure the `config.js` with the right `PORT` which is the port the API will listen.

## Getting started
To run the server, simply do:
```bash
$ npm i
$ npm start
```

The server is now listening to the port you just defined and ready to serve the TNP Client.

## Credits
Made by [ENGELS Mathis](https://github.com/MathisEngels) and [BAUDUIN Thomas](https://github.com/radikaric) for the last year of our master's degree.