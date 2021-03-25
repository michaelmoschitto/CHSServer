import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import {useSelector} from 'react-redux';

const LikedBy = props => {
   // const msgId = props.msgId
   const likes = useSelector(store => store.Likes);

   let divs = [];
   (function () {
      likes && likes[props.msgId] && 
       likes[props.msgId].forEach((l, index) => {
          divs.push(
             <div key={index}>{`${l.firstName} ${l.lastName}`}</div>);
       })
   })();

   return (
      <Popup
         trigger={
            <div key={10} onClick={
             () => props.likeMsg()}>{props.numLikes + ' Likes'}</div>
         }
         on="hover"
         position="right"
         arrow={true}
      >
         {divs.length ? divs.slice(0, 5) : ''}
      </Popup>
   );
};

export default LikedBy;
