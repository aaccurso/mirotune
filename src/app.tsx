import React, {useState, useEffect} from 'react';
import ReactDOM from 'react-dom';
import SoundfontProvider from './components/SoundfontProvider';
import { VirtualKeyboard } from './components/VirtualKeyboard';

const audioContext = new window.AudioContext();
const soundfontHostname = 'https://d1pzp51pvbm36p.cloudfront.net';

const RECORDING_INTERVAL_MS = 50

interface NoteEvents {
  midiNumber: number
  time: number
  type: 'start' | 'stop'
}

type ActiveNotes = Record<number, boolean>

function App() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedNotes, setRecordedNotes] = useState<NoteEvents[]>([])
  const [recordingTimeMilliseconds, setRecordingTimeMilliseconds] = useState(0)
  const [activeNotes, setActiveNotes] = useState<ActiveNotes>({})

  useEffect(() => {
    if (!isRecording) {
      return
    }
    const interval = setInterval(() => {
      setRecordingTimeMilliseconds(recordingTimeMilliseconds => recordingTimeMilliseconds + RECORDING_INTERVAL_MS);
    }, RECORDING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isRecording]);


  const startRecording = () => {
    setIsRecording(true)
    setRecordedNotes([])
  }
  const stopRecording = () => {
    setIsRecording(false)
    setRecordingTimeMilliseconds(0)
    setActiveNotes({})
  }
  const handlePlayNoteInput = (midiNumber: number) => {
    console.log('handlePlayNoteInput', activeNotes, midiNumber)
    if (activeNotes[midiNumber] || !isRecording) {
      return
    }
    setActiveNotes({...activeNotes, [midiNumber]: true})
    setRecordedNotes([...recordedNotes, {
      midiNumber,
      time: recordingTimeMilliseconds,
      type: 'start'
    }])
  }
  const handleStopNoteInput = (midiNumber: number) => {
    console.log('handleStopNoteInput', activeNotes, midiNumber)
    if (!activeNotes[midiNumber] || !isRecording) {
      return
    }
    setActiveNotes({...activeNotes, [midiNumber]: false})
    setRecordedNotes([...recordedNotes, {
      midiNumber,
      time: recordingTimeMilliseconds,
      type: 'stop'
    }])
  }

  return (
    <div className="grid wrapper">
      <div className="cs1 ce12">
        <SoundfontProvider
          instrumentName="acoustic_grand_piano"
          audioContext={audioContext}
          hostname={soundfontHostname}
          render={({ isLoading, playNote, stopNote }) => (
            <VirtualKeyboard
              disabled={isLoading}
              playNote={playNote}
              stopNote={stopNote}
              onPlayNoteInput={handlePlayNoteInput}
              onStopNoteInput={handleStopNoteInput}
            />
          )}
        />
      </div>
      <div className="cs1 ce12">
        <button className="button button-primary" type="button" onClick={() => isRecording ? stopRecording() : startRecording()}>
          {isRecording ? 'Done' : 'Record'}
        </button>
      </div>
      <div className="cs1 ce12">
        Recording time: {recordingTimeMilliseconds} ms
        {recordedNotes.map((note, index) => (
          <div key={index}>Midi number: {note.midiNumber} Time: {note.time} Type: {note.type}</div>
        ))}
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
