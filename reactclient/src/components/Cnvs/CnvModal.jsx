import React, { Component } from 'react';
import {
    Modal, Button, Form, FormControl, FormGroup
} from 'react-bootstrap';

export default class CnvModal extends Component {
   constructor(props) {
      super(props);
      this.state = {
         cnvTitle: (this.props.cnv && this.props.cnv.title) || "",
      }
   }

   close = (result) => {
      this.props.onDismiss && this.props.onDismiss({
         status: result,
         title: this.state.cnvTitle
      });
   }

   getValidationState = () => {
      if (this.state.cnvTitle) {
         return null;
      }
      return "warning";
   }

   handleChange = (e) => {
      this.setState({cnvTitle: e.target.value}); //each time letter is typed, update state and redraw occurs
   }

   componentWillReceiveProps = (nextProps) => {
      if (nextProps.showModal) {
         this.setState(
          { cnvTitle: (nextProps.cnv && nextProps.cnv.title) || "" })
      }
   }

   render() {
      return (
         <Modal show={this.props.showModal} onHide={() => this.close("Cancel")}> {/* built in modal*/}
            <Modal.Header closeButton>
               <Modal.Title>{this.props.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
               <Form>
                  <FormGroup controlId="formBasicText"
                   validationState={this.getValidationState()}
                  >
                     <Form.Label>Conversation Title</Form.Label>
                     <FormControl
                        type="text"
                        value={this.state.cnvTitle}
                        placeholder="Enter text"
                        onChange={this.handleChange} //every time a letter is entered, handleChange is called
                     />
                     <FormControl.Feedback />
                     <Form.Text className="text-muted"> {/* light gray text*/}
                        Title is required
                     </Form.Text>
                  </FormGroup>
               </Form>
            </Modal.Body>
            <Modal.Footer>
               <Button onClick={() => this.close("Ok")}>Ok</Button>
               <Button onClick={() => this.close("Cancel")}>Cancel</Button>
            </Modal.Footer>
         </Modal>)
   }
}