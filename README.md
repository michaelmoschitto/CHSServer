# Chat Service (CHS) Typescript Server and Javascript Client

### Server Setup
    Run options:

        Navigate to JSServer/Src

        1) Run without debugging -> npm start aka node main.js -p <port>
        Standard run of the server without debugging. npm start is essentially
        an alias to node main.js -p <port> which in this case has been set to 
        4015 on start and 3001 on debug.

            * tsc / compiling: JSServer/tsconfig.json
            * npm start/debug commands: JSServer/package.json

            NOTE: In package.json $INIT_CWD takes the places of the hardcoded 
            path to the directory. This may not work on Windows machines in 
            which case it would be easier to use the absolute path.
                ex: "start": "node /Users/MichaelMoschitto/Desktop/Project2
                /JSServer/built/main.js -p 4015"

        2) Run WITH debugging -> npm run debug -p <port>
            Ability to debug Node.js apps with the standard VSCode debugger. 
            
            Debugger Setup instructions
                https://code.visualstudio.com/docs/nodejs/nodejs-debugging

            Nodemon Github
                https://github.com/microsoft/vscode-recipes/tree/master/nodemon

        Nodemon: Vanilla npm does not have the ability to restart Node.js 
         servers each time changes are made as is done in React which is why  
         Nodemon is used. Post-setup, it is linked to server startup in 
         JSServer/package.json.

        Aliases: during development it was helpful to have aliases to 
         recompile and run the TS server as Nodemon only works for JS. 

            alias built="cd ~/Desktop/Project2/JSServer/built"
            alias src="cd ~/Desktop/Project2/JSServer/Src"
            alias brun="src
                    tsc
                    built
                    npm run debug -p 3001"
            alias run="built
                    node main.js -p 3001"


### Client Setup

    The easiest way to copy the client is to 
        1) npx create-react-app ReactJS wherever you want your new project to be
        2) Copy all of the source files over

    Run Options: 

        Navigate to .../reactclient/src

        npm start -> starts react server 

        Debug: I chose to debug React in VSCode as opposed to the browser. 
        Instructions for setup can be found here:
            https://code.visualstudio.com/docs/nodejs/reactjs-tutorial

        Note: 

         React starts the client server on port 3000 by default.

         It is also important to be aware of which port the rest server was 
         started on as the url is hardcoded into reactclient/src/api.js to be 
         used in all REST server calls. 

         
### Database Setup 

    The REST server used a local MySQL DB to store information about sessions,
     people, conversations etc. 

    Connection options: The server uses connection information stored in 
     JSServer/Src/connection.json. 

    It was also helpful to use a SQL client application SequelPro to inspect 
     what was actually in the DB. 
