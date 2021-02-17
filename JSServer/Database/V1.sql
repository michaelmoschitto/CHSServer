drop database if exists project2DB;
create database project2DB;
use project2DB;

create table Person (
   id int auto_increment primary key,
   firstName varchar(30),
   lastName varchar(50) not null,
   email varchar(150) not null,
   password varchar(50),
   whenRegistered datetime not null,
   termsAccepted datetime,
   role int unsigned not null,  # 0 normal, 1 admin
   unique key(email)
);

create table Conversation (
   id int auto_increment primary key,
   ownerId int not null,
   title varchar(80) not null,
   lastMessage datetime,
   constraint FKMessage_ownerId foreign key (ownerId) references Person(id)
    on delete cascade,
   unique key UK_title(title)
);

create table Message (
   id int auto_increment primary key,
   cnvId int not null,
   prsId int not null,
   whenMade datetime not null,
   content varchar(5000) not null,
   numLikes int not null,
   constraint FKMessage_cnvId foreign key (cnvId) references Conversation(id)
    on delete cascade,
   constraint FKMessage_prsId foreign key (prsId) references Person(id)
    on delete cascade
);

create table Likes(
   id int auto_increment primary key,
   msgId int not null,
   prsId int not null,

   constraint FKLike_msgId foreign key (msgId) references Message(id) 
    on delete cascade,
   constraint FKLike_prsId foreign key (prsId) references Person(id)
    on delete cascade,

    unique key UK_msgPrs(msgId, prsId)

);

insert into Person (firstName, lastName, email,       password,   whenRegistered, role)
            VALUES ("Joe",     "Admin", "adm@11.com", "password", NOW(), 1);
