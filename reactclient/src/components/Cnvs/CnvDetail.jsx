//There is nothing here!!
import React, { useEffect , useState} from 'react';
import { useParams } from 'react-router-dom';
import { ListGroupItem, Row, Col, Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import {LikedBy} from '../components'

const CnvDetail = (props) => {
    const {cnvId} = useParams();
    const msgs = useSelector(store => store.Msgs);
    console.log('MSGS: ', msgs);

    useEffect(() => {
        if(!msgs.length)
            props.getMsgsByCnv(cnvId);
    });


    let openMsgModal = () => {
        console.log("Opening Message Modal")
    };

    let msgClicked = () => {
        console.log('Show Message Content!')
    }

    let msgItems = [];

    console.log('MSGS: ', msgs)
    if(msgs.length)
        msgs.forEach(msg => {
            msgItems.push(
            <MsgItem
                clicked={() => msgClicked()}
                showContent={false}
                key={msg.id}
                poster={msg.email}
                whenMade={msg.whenMade}
                likes={msg.numLikes}
                content={msg.content}
            />)
        });

    return (
        <section className='container'>
            <h1>Conversation Title</h1>
            {msgItems}
            <Button variant="primary" className="mt-2" onClick=
            {() => openMsgModal()}>New Message</Button>

        </section>
    
    );
};



const MsgItem = props => {
    const [toggleContent, setToggle] = useState(false);
    const [toggleLikes, setToggleLikes] = useState(false);
    
    let clicked = () => {
        setToggle(!toggleContent)
    }

    return (
        <ListGroupItem>
            <Row>
                <Col onClick={clicked} sm={4}>
                    {props.poster}
                </Col>

                <Col sm={6}>
                    {new Intl.DateTimeFormat('us',{ year: "numeric",
                     month: "short", day: "numeric",
                     hour: "2-digit", minute: "2-digit", second: "2-digit"})
                     .format(props.whenMade)}
                </Col>
                <Col sm={2} onMouseOver={() => {
                    console.log('moused');
                }}>
                    <LikedBy numLikes={props.likes}/>
                </Col>

            </Row>

            <Row show={false.toString()}><Col show={false.toString()}>
                {toggleContent? props.content : ''}</Col>
            </Row>
        </ListGroupItem>

    )
};

export default CnvDetail;