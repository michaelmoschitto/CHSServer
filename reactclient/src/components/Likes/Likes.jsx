import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';


const LikedBy = (props) => (
<Popup trigger={<div>{props.numLikes + ' Likes'}</div>}open={props.show} 
 on="hover" position="right" arrow={true}>
    <div>user 1</div>
    <div>user 2</div>
    <div>user 3</div>
</Popup>
  );

export default LikedBy;