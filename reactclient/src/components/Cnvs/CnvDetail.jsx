//There is nothing here!!
import React, {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {ListGroupItem, Row, Col, Button} from 'react-bootstrap';
import {useSelector} from 'react-redux';
import {LikedBy} from '../components';

const CnvDetail = props => {
   const {cnvId} = useParams();
   const msgs = useSelector(store => store.Msgs);
   const [refresh, setRefresh] = useState(false)
   // let [renderMsgs, setRenderMsgs] = useState(false);

   useEffect(() => {
      // props.getMsgsByCnv(cnvId);
      // if(!msgs.length)
      if(refresh)
         props.getMsgsByCnv(cnvId);
      setRefresh(false)

   });
 
   let openMsgModal = () => {
      console.log('Opening Message Modal');
   };

   let msgItems = [];

   if (msgs.length){
      msgs.forEach(msg => {
         console.log('poster: ', msg.poster)
         console.log('current email', props.Prs.email)
         console.log(msg)
         msgItems.push(
            <MsgItem
               // c={console.log('Prs: ', props.Prs)}
               // co={console.log('CNVS', props.Cnvs)}
               // cl={console.log('cnvID', cnvId)}
               // cw={console.log(props.Prs.email !== msg.poster)}
               // const found = array1.find(element => element > 10);
               // likeAble={props.Prs.email !== msg.email}
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
         <span>&nbsp;&nbsp;&nbsp;</span>
         <Button
            variant="primary"
            className="mt-2"
            onClick={() => setRefresh(true)}
         >
            
            Refresh
         </Button>
      </section>
   );
};

const MsgItem = props => {
   const [toggleContent, setToggle] = useState(false);
   const [toggleLikes, setToggleLikes] = useState(false);
   // const likes = useSelector(store => store.Likes)

   let clicked = () => {
      setToggle(!toggleContent);
   };

   useEffect(() => {

      props.getMsgsLikes(props.msgId);
   });

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
               //  getLikes={() => props.getMsgsLikes(props.msgId)}
                />
            </Col>
         </Row>

         <Row show={false.toString()}>
            <Col show={false.toString()}>
               {toggleContent ? props.content : ''}
            </Col>
         </Row>
      </ListGroupItem>
   );
};

export default CnvDetail;
