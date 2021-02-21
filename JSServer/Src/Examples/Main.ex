/* Equivalent expanded code for instructional reference
            async.series([
               function(callback){
                  cnn.query('delete from Person`', callback);
               },
               function(callback){
                  cnn.query('delete from Conversation', callback);
         },
         function(callback){
            cnn.query('delete from Message', callback);
         },
         function(callback){
            cnn.query('alter table Person auto_increment = 1', callback);
         },
         function(callback){
            cnn.query('alter table Conversation auto_increment = 1', callback);
         },
         function(callback){
            cnn.query('alter table Message auto_increment = 1', callback);
         },
         function(callback){
            cnn.query('INSERT INTO Person (firstName, lastName, email,' +
                ' password, whenRegistered, role) VALUES ' +
                '("Joe", "Admin", "adm@11.com","password", NOW(), 2);',
             callback);
         },
         function(callback){
            for (var session in Session.sessions)
               delete Session.sessions[session];
            res.send();
         }
      ],
      err => {
        req.cnn.release();
        if (err)
           res.status(400).json(err);
        else
           res.status(200).end();
      }
   );*/