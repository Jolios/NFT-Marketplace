import Blockies from "react-blockies";
function Blockie(props) {
  const  walletAddress  = null;
  if (!props.address ){
    console.log("null")
    return null;
  } 

  return (
    <Blockies
      seed={props.address.toLowerCase()}
      className="identicon"
      {...props}
    />
  );
}

export default Blockie;