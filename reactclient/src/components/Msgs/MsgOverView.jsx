import React, {useEffect} from 'react';
import {Link} from 'react-router-dom';
import {ListGroup, ListGroupItem, Col, Row} from 'react-bootstrap';
import {LikedBy} from '../components';
import {useSelector} from 'react-redux';

import './MsgOverView.css';

const MsgOverView = props => {
   const Msgs = useSelector(store => store.Msgs);
   const boldedDate = useSelector(store => store.Order);
   const Prs = useSelector(store => store.Prs);
   const Likes = useSelector(store => store.Likes);

   console.log('rendering MsgOverView')
   useEffect(() => {

      if (!Msgs.length || ( Msgs.length && 
       Msgs.find(msg => msg.prsId !== Prs.id))) {
         const orderBy = boldedDate ? 'date' : 'likes';
         props.getPrsMsgs(Prs.id, orderBy);
      }

     
   });

   //create Rows of Messages
   let msgItems = [];
   if (Msgs.length) {
      Msgs.forEach(msg => {
         msgItems.push(<MsgItem numLikes=
          {Likes[msg.id] ? Likes[msg.id].length : 0}
          Msg={msg} key={msg.id} {...props} />);
      });
   }

   return (
      <section className="container">
         <h1>Messages Overview</h1>

         <ListGroup>
            <ListGroupItem>
               <Row>
                  <Col className="header">Content</Col>

                  <Col
                     onClick={() => {
                        props.setOrderBy('Date');
                        props.getPrsMsgs(Prs.id, 'date');
                     }}
                     className={`header ${boldedDate ? 'bolded' : ''}`}
                  >
                     {`Date ${boldedDate ? String.fromCharCode(8595) : ''}`}
                  </Col>

                  <Col
                     onClick={() => {
                        props.setOrderBy('Likes');
                        props.getPrsMsgs(Prs.id, 'likes');
                     }}
                     className={`header ${!boldedDate ? 'bolded' : ''}`}
                  >
                     {`Likes ${!boldedDate ? String.fromCharCode(8595) : ''}`}
                  </Col>
               </Row>
            </ListGroupItem>
            {msgItems}
         </ListGroup>
      </section>
   );
};

const MsgItem = props => {
   const Prs = useSelector(store => store.Prs);
   const Cnvs = useSelector(store => store.Cnvs);

   return (
      <ListGroupItem>
         <Row>
            <Col sm={4}>
               <Link to={`CnvDetail/${props.Msg.cnvId}`}>
                  {props.Msg.content.substring(0, 20) + ' ...'}
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
               }).format(props.Msg.whenMade)}
            </Col>
            <Col sm={2}>
               <LikedBy
                  msgId={props.Msg.id}
                  likeMsg={() => {
                     return props.postLike(
                        props.Msg.id,
                        Prs,
                        props.Msg.email !== Prs.email
                     );
                  }}
                  numLikes={props.numLikes}            
            />
            </Col>
         </Row>
      </ListGroupItem>
   );
};

export default MsgOverView;
