import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {ListGroup, Col, Row, Button} from 'react-bootstrap';
import CnvModal from './CnvModal';
import {ConfDialog} from '../components';
import {useSelector} from 'react-redux';
import './CnvOverview.css';

//functional react component
export default props => {
   const [showCnvModal, setShowCnvModal] = useState(false); //initial value of false that is only passed the first time
   const [showDelConfirm, setShowDelConfirm] = useState(false); //these will get run hundreds of times, react component has to know the order
   const [trgCnv, setTrgCnv] = useState(null); // HAVE TO CALL THESE useState calls in this same order

   const cnvs = useSelector(store => store.Cnvs); //another type of hook, how interact with Redux Library
   const prs = useSelector(store => store.Prs) //call useSelector and provide function that extracts information you want
                                             // can run function later, if result is different not only selecting information, but communicating what will 
                                             // be needed for redraw. Registers cnvs with React and sensitizes it to redraw if the output of this function ever changes

   useEffect(() => { //housekeeping done when component is setup. run everytime it redraws which is why cnvs.length protector is used
      cnvs.length || props.updateCnvs(); //if there are no current cnvs, call updateCnvs() to load current Cnvs into the react store
   });               // can't just call function becuase updateCnvs is async, don't want to show user blank page

   // Open title-setting modal with an optional existing |cnv|
   let openCnvModal = (cnv) => {
      setTrgCnv(cnv); //setState call
      setShowCnvModal(true); //setStateCall
   };

   let closeCnvModal = (result) => { //shuts the cnvsModal window down 
      if (result.status === "OK") {
         if (trgCnv)
            props.modCnv(trgCnv.id, result.cnvTitle); //either modify existing cnv
         else
            props.addCnv({title: result.cnvTitle}); // or create new cnv
      }
      setShowCnvModal(false); // sets showCnvModal to false and will cause redraw closing window
   }

   let openDelConfirm = (cnv) => {
      setTrgCnv(cnv);
      setShowDelConfirm(true);
   }

   let closeDelConfirm = (res) => {
      if (res === 'yes') 
         props.delCnv(trgCnv.id);

      setShowDelConfirm(false);
   }

   let cnvItems = [];

   cnvs.forEach(cnv => {
      //! Bug here something wrong with if
      if (!props.userOnly || prs.id === cnv.id) // either only show user
         cnvItems.push(<CnvItem //subcomponent acts as 1 row of cnvs table
            key={cnv.id} {...cnv}
            showControls={cnv.ownerId === prs.id}
            onDelete={() => openDelConfirm(cnv)}
            onEdit={() => openCnvModal(cnv)} />);
   });

   return (
      <section className="container">
         <h1>Cnv Overview</h1>
         <ListGroup>
            {cnvItems}
         </ListGroup>
         <Button variant="primary" className="mt-2" onClick=
            {() => openCnvModal()}>New Conversation</Button>
         {/* Modal for creating and change cnv */}
         <CnvModal
            show={showCnvModal} //edit cnvs modal
            title={trgCnv ? "Edit title" : "New Conversation"}
            cnv={trgCnv}
            onDismiss={closeCnvModal} />
         <ConfDialog
            show={showDelConfirm} //delete cnvs modal
            title="Delete Conversation"
            body={`Are you sure you want to delete the Conversation
               '${trgCnv ? trgCnv.title : ''}'`}
            buttons={['Yes', 'No']}
            onClose={closeDelConfirm}/>
      </section>
   )
}

// A Cnv list item
const CnvItem = props => {
   return (
      <ListGroup.Item>
         <Row> {/* row for each cnvs */} 
            <Col sm={4}><Link to={"/CnvDetail" + props.id}> {/*sm means that for any window size small or smaller than small,
                                                            takes 1/3 of space. since 12 column layout and passed 4*/}
               {props.title}</Link></Col>
            <Col sm={4}>{props.lastMessage ? new Intl.DateTimeFormat('us',
               {
                  year: "numeric", month: "short", day: "numeric",
                  hour: "2-digit", minute: "2-digit", second: "2-digit" //object describing date/time format
               })
               .format(props.lastMessage) : "N/A"}</Col> {/* call .format on DateTimeFormat to format message */}
            {props.showControls ? //showControls shows edit and delete controls
               <Col sm={4} className="d-flex justify-content-md-end">
                  <Button size="sm" className="ml-auto" onClick={props.onDelete}> { /* ml-auto forces right justification*/}
                     <span className="fa fa-trash-alt"/> {/* fav icons library call. Create button as span with background image*/}
                  </Button>                              {/* fa-trash-alt is the trash icon*/}
                  <Button size="sm" onClick={props.onEdit} className="ml-1">
                     <span className="fa fa-edit"/>
                  </Button>
               </Col>
               : ''} {/*  or don't show controls*/}
         </Row>
      </ListGroup.Item>
   )
}