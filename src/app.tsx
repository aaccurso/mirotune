import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import SoundfontProvider from './components/SoundfontProvider';
import { VirtualKeyboard } from './components/VirtualKeyboard';

// webkitAudioContext fallback needed to support Safari
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const soundfontHostname = 'https://d1pzp51pvbm36p.cloudfront.net';



function App() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedNotes, setRecordedNotes] = useState([])
  const [recordingStartTime, setRecordingStartTime] = useState()
  const startRecording = () => {
    setIsRecording(true)
  }
  const stopRecording = () => {
    setIsRecording(false)
  }

  return (
    <div className="grid wrapper">
      <div className="cs1 ce12">
        <h1>MiroTune</h1>
      </div>
      <div className="cs1 ce12">
        <SoundfontProvider
        instrumentName="acoustic_grand_piano"
        audioContext={audioContext}
        hostname={soundfontHostname}
        render={({ isLoading, playNote, stopNote }) => (
          <VirtualKeyboard disabled={isLoading} playNote={playNote} stopNote={stopNote} />
        )}/>
      </div>
      <div className="cs1 ce12">
        <button className="button button-primary" type="button" onClick={() => isRecording ? stopRecording() : startRecording()}>
          {isRecording ? 'Done' : 'Record'}
        </button>
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
