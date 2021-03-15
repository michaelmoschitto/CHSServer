//There is nothing here!!
import React, {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {ListGroupItem, Row, Col, Button, Container} from 'react-bootstrap';
import {useSelector} from 'react-redux';
import {LikedBy, MsgModal} from '../components';

const CnvDetail = props => {
   const {cnvId} = useParams();
   const [showModal, setModalShow] = useState(false)
   const msgs = useSelector(store => store.Msgs);
   const [refresh, setRefresh] = useState(false)
   // let [renderMsgs, setRenderMsgs] = useState(false);

   useEffect(() => {
      // props.getMsgsByCnv(cnvId);
      // if(!msgs.length)
      if(props.msgId)
         props.getMsgsLikes(props.msgId);

      if(refresh)
         props.getMsgsByCnv(cnvId);
      setRefresh(false)

   });
 
   let openMsgModal = () => {
      console.log('Opening Message Modal');
      setModalShow(true);
   };

   let closeMsgModal = (res, msg = null) => {
      
      if(res === 'Ok'){
         console.log('posting MSG: ', msg)
         props.postMsg(cnvId, msg)
      }
      else  
         console.log(res)

      setModalShow(false)
   }



   let msgItems = [];

   if (msgs.length){
      msgs.forEach(msg => {
         
         msgItems.push(
            <MsgItem
               Prs={props.Prs}
               msgId={msg.id}
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

   return (
      <section className="container">
         <h1>Conversation Title</h1>
         {msgItems}
         <Button
            variant="primary"
            className="mt-2"
            onClick={() => openMsgModal()}
         > 
            New Message
         </Button>

         {/* spacer */}
         <span>&nbsp;&nbsp;&nbsp;</span>

         <Button
            variant="secondary"
            className="mt-2"
            onClick={() => setRefresh(true)}
         >
            
            Refresh
         </Button>
         <MsgModal showModal={showModal}
          onDismiss={(res, msg) => closeMsgModal(res, msg)}/>
      </section>
   );
};

const MsgItem = props => {
   const [toggleContent, setToggle] = useState(false);

   let clicked = () => {
      setToggle(!toggleContent);
   };

   return (
      <ListGroupItem>
         <Row>
            <Col onClick={clicked} sm={4}>
               {props.poster}
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
         
            <Row show={false.toString()}>
               <Col show={false.toString()} 
                style={{'wordWrap' : 'break-word'}}>
                  {toggleContent ? props.content : ''}
               </Col>
            </Row>
      </ListGroupItem>
      
   );
};

export default CnvDetail;
