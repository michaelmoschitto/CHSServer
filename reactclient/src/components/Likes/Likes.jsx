import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import {useSelector} from 'react-redux';


const LikedBy = (props) => {
    // const msgId = props.msgId;

    const likes = useSelector(store => store.Likes);
    
    let divs = [];
    (function(){
    
        likes && likes[props.msgId] && likes[props.msgId].forEach((l) => 
         divs.push(<div>{`${l.firstName} ${l.lastName}`}</div>))
    })();

    return (
        <Popup trigger={<div onClick={() => props.likeMsg()}
         >{divs.length + ' Likes'}</div>} 
          on="hover" position="right" arrow={true} 
        //  onOpen={()=>{props.getLikes()}}
         >
    
            {divs.length ? divs : ''}
        </Popup>
    );
};

export default LikedBy;