import React, {useState, useEffect} from 'react';
import {Link, Redirect} from 'react-router-dom';
import {ListGroup, ListGroupItem, Col, Row, Button, Nav} from 'react-bootstrap';
import {ConfDialog, LikedBy} from '../components';
import {useSelector, setState} from 'react-redux';

import './MsgOverView.css'


const MsgOverView = props => {
   // return <div>Hello World</div>
   const msgs = useSelector(store => store.Msgs);
   const boldedDate = useSelector(store => store.Order)


   
   useEffect(() => {
      if(!msgs.length){
         const orderBy = boldedDate? 'date' : 'likes'
         props.getPrsMsgs(props.Prs.id, orderBy)
      }
   });
   //create Rows of Messages
   let msgItems = [];
   if (msgs.length){
      msgs.forEach(msg => {
         
         msgItems.push(
            <MsgItem
               Prs={props.Prs}
               msgId={msg.id}
               cnvId={msg.cnvId}
               showContent={false}
               key={msg.id}
               poster={msg.email}
               whenMade={msg.whenMade}
               likes={msg.numLikes}
               content={msg.content}
               {...props}
            />
         );
      });
   }


   return( 
   <section className="container">
      <h1>Messages Overview</h1>

      <ListGroup>
         <ListGroupItem>
            <Row>
               
                        <Col className='header'>Content</Col>
                        
                        <Col onClick={() => {
                           props.setOrderBy('Date')
                           props.getPrsMsgs(props.Prs.id, 'date')
                        }}
                        className={`header ${(boldedDate)? 'bolded' : '' }`}>

                           {`Date ${boldedDate? String.fromCharCode(8595) : ''}`}
                        
                        </Col>

                        <Col onClick={() => {
                           props.setOrderBy('Likes')
                           props.getPrsMsgs(props.Prs.id, 'likes')
                     }}
                        className={`header ${(!boldedDate)? 'bolded' : '' }`}>

                           {`Likes ${!boldedDate? String.fromCharCode(8595) : ''}`}
                        
                        </Col>
                     
            </Row>
         </ListGroupItem>
         {msgItems}
      </ListGroup>
   </section>);
};



const MsgItem = props => {
   
   return (
      <ListGroupItem>
         <Row>
            <Col sm={4}>
               <Link to={`CnvDetail/${props.cnvId}`}>
                {props.content.substring(0,20) + ' ...'}
               </Link>
            </Col>

            <Col sm={6}>
               {new Intl.DateTimeFormat('us', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
               }).format(props.whenMade)}
            </Col>
            <Col sm={2}>
               {/* addLike={props.} */}
               <LikedBy
                msgId={props.msgId} 
                likeMsg={() => {
                return props.postLike(props.msgId, props.Prs, 
                props.poster !== props.Prs.email)}}
                getLikes={() => props.getMsgsLikes(props.msgId)}
                />
            </Col>
         </Row>
      </ListGroupItem>
      
   );
};

export default MsgOverView;
