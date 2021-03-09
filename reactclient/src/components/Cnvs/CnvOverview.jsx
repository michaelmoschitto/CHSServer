import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {ListGroup, Col, Row, Button} from 'react-bootstrap';
import CnvModal from './CnvModal';
import {ConfDialog} from '../components';
import {useSelector} from 'react-redux';
import './CnvOverview.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit } from "@fortawesome/free-solid-svg-icons";

// A Cnv list item


const CnvOverView = props => {
   const [showCnvModal, setShowCnvModal] = useState(false);
   const [showDelConfirm, setShowDelConfirm] = useState(false);
   const [trgCnv, setTrgCnv] = useState(null);

   const cnvs = useSelector(store => store.Cnvs);
   const prs = useSelector(store => store.Prs)
 

   useEffect(() => {
     cnvs.length || props.updateCnvs();
   });
   
   // Open title-setting modal with an optional existing |cnv|
   let openCnvModal = (cnv) => {
      setTrgCnv(cnv);
      setShowCnvModal(true);
   };
   
   let closeCnvModal = (result) => {
      if (result.status === "Ok") {
         if (trgCnv)
            props.modCnv(trgCnv.id, result.title);
         else
            props.addCnv({title: result.title});
            
      }
      setShowCnvModal(false);
   }

   //no closure, since passed to show: boolean
   let openDelConfirm = (cnv) => {
      setTrgCnv(cnv);
      setShowDelConfirm(true);
   }

   //closure, since passed to onHide: func
   let closeDelConfirm = (res) => () => {
      console.log("props in CloseDel ", props)
      if (res === 'Yes') 
         props.delCnv(trgCnv.id);

      setShowDelConfirm(false);
   }

   let cnvItems = [];
   
   cnvs.forEach(cnv => {
      if (!props.userOnly || prs.id === cnvs.ownerId)
         cnvItems.push(<CnvItem
            key={cnv.id} {...cnv}
            showControls={cnv.ownerId === prs.id}
            onDelete={() => openDelConfirm(cnv)}
            onEdit={() => openCnvModal(cnv)} />);
   });

   return (
      <section className="container" console={console.log("rendering overivew")}>
         <h1>Cnv Overview</h1>
         <ListGroup>
            {cnvItems}
         </ListGroup>
         <Button variant="primary" className="mt-2" onClick=
            {() => openCnvModal()}>New Conversation</Button>
         {/* Modal for creating and change cnv */}
          <CnvModal
            showModal={showCnvModal}
            title={trgCnv ? "Edit title" : "New Conversation"}
            cnv={trgCnv}
            onDismiss={closeCnvModal} />
         <ConfDialog
            show={showDelConfirm}
            title="Delete Conversation"
            body={`Are you sure you want to delete the Conversation
               '${trgCnv ? trgCnv.title : ''}'`}
            buttons={['Yes', 'No']}
            onClose={closeDelConfirm} />
      </section>
   
   )
}

const CnvItem = props => {
    return (
       <ListGroup.Item>
          <Row>
             <Col sm={4}><Link to={"/CnvDetail" + props.id}>
                {props.title}</Link></Col>
             <Col sm={4}>{props.lastMessage ? new Intl.DateTimeFormat('us',
                {
                   year: "numeric", month: "short", day: "numeric",
                   hour: "2-digit", minute: "2-digit", second: "2-digit"
                })
                .format(props.lastMessage) : "N/A"}</Col>
             {props.showControls ?
                <Col sm={4} className="d-flex justify-content-md-end">
                   <Button size="sm" className="ml-auto" 
                    onClick={props.onDelete}>
                     <FontAwesomeIcon icon={faTrash} />                     
                   </Button>
                   <Button size="sm" onClick={props.onEdit} className="ml-1">
                      <FontAwesomeIcon icon={faEdit} />  
                   </Button>
                </Col>
                : ''}
          </Row>
       </ListGroup.Item>
    )
 }


export default CnvOverView;