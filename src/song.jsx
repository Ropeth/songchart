
import reactLogo from './assets/react.svg'


export default function Song({ title, artist, audioUrl}) {
  if (title == null) return <p>Song not found</p>;

  return (
    <div className='songbox'>
      <audio controls src={audioUrl} style={{ width: "100%" }}>
        Your browser does not support the audio element.
      </audio>
      <img src={reactLogo} className="songpic" alt={title}/>
      <p>{artist}</p>
      <p>{title}</p>
    </div>
  );
}