import React from 'react';
import {Modal, Button} from 'react-bootstrap';
import {useSelector} from 'react-redux';

const ErrorModal = props => {
   const Errors = useSelector(store => store.Errors)
   
   return (   
         <Modal
            show={Errors.length? true: false}
            backdrop="static"
            keyboard={false}
         >
            <Modal.Header closeButton>
               <Modal.Title>Error Notice</Modal.Title>
            </Modal.Header>
            <Modal.Body>
               
               {Errors.length && 
                Errors.map((e, index) => (<div key={index}>{e}</div>))}
            </Modal.Body>
            <Modal.Footer>
               <Button variant="primary" onClick={props.onClear}>
                  Ok
               </Button>
            </Modal.Footer>
         </Modal>
      
   );
};

export default ErrorModal;
