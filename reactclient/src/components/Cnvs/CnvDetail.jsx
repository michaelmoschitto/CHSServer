//There is nothing here!!
import React, {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {ListGroupItem, Row, Col, Button} from 'react-bootstrap';
import {useSelector} from 'react-redux';
import {LikedBy, MsgModal} from '../components';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faSync} from '@fortawesome/free-solid-svg-icons';

const CnvDetail = props => {
   const {cnvId} = useParams();
   const [showModal, setModalShow] = useState(false);
   const Msgs = useSelector(store => store.Msgs);
   const [refresh, setRefresh] = useState(true);
   const Likes = useSelector(store => store.Likes);

   // let [renderMsgs, setRenderMsgs] = useState(false);

   useEffect(() => {
      // props.getMsgsByCnv(cnvId);
      // if(!msgs.length)
      // if(props.msgId)
      //    props.getMsgsLikes(props.msgId);

      if (refresh) {
         props.getMsgsByCnv(cnvId);
         Msgs && Msgs.length && Msgs.forEach(msg => props.getMsgsLikes(msg.id));
      }
      setRefresh(false);
   });

   let openMsgModal = () => {
      console.log('Opening Message Modal');
      setModalShow(true);
   };

   let closeMsgModal = (res, msg = null) => {
      if (res === 'Ok') {
         console.log('posting MSG: ', msg);
         props.postMsg(cnvId, msg);
      } else console.log(res);

      setModalShow(false);
   };

   let msgItems = [];

   if (Msgs.length) {
      Msgs.forEach((msg, index) => {
         msgItems.push(
            <MsgItem
               numLikes={Likes[msg.id] ? Likes[msg.id].length : 0}
               Msg={msg}
               key={index}
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
            <FontAwesomeIcon icon={faSync} />
         </Button>

         <MsgModal
            showModal={showModal}
            onDismiss={(res, msg) => closeMsgModal(res, msg)}
         />
      </section>
   );
};

const MsgItem = props => {
   const [toggleContent, setToggle] = useState(false);
   const Prs = useSelector(store => store.Prs);

   let clicked = () => {
      setToggle(!toggleContent);
   };

   return (
      <ListGroupItem>
         <Row>
            <Col onClick={clicked} sm={4}>
               {props.Msg.email}
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

         <Row show={false.toString()}>
            <Col show={false.toString()} style={{wordWrap: 'break-word'}}>
               {toggleContent ? props.Msg.content : ''}
            </Col>
         </Row>
      </ListGroupItem>
   );
};

export default CnvDetail;
