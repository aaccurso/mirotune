import React, {useState, useEffect} from 'react';
import ReactDOM from 'react-dom';
import SoundfontProvider from './components/SoundfontProvider';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { keyBoards } from './script-board'
import { midiNote } from './utils/midiNote';

const audioContext = new window.AudioContext();
const soundfontHostname = 'https://d1pzp51pvbm36p.cloudfront.net';

const RECORDING_INTERVAL_MS = 50

interface BoardKeyboard {
  startRecording(): Promise<void>;
  stopRecording(): void;
  startNote(note: any, startTime: any): Promise<false | undefined>;
  stopNote(note: any, finishTime: any): Promise<void>;
  play(): void;
  pause(): void;
  stopPlaying(): void;
}

type ActiveNotes = Record<number, boolean>

function App() {
  const keyboards = keyBoards()
  const [recordKeyboard, setRecordKeyboard] = useState<BoardKeyboard>()
  const [isRecording, setIsRecording] = useState(false)
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


  const startRecording = async () => {
    const keyboard = await keyboards.createKeyboard()
    setRecordKeyboard(keyboard)
    keyboard.startRecording()
    setIsRecording(true)
    setRecordedNotes([])
  }
  const stopRecording = () => {
    recordKeyboard?.stopRecording()
    setIsRecording(false)
    setRecordingTimeMilliseconds(0)
    setActiveNotes({})
  }
  const handlePlayNoteInput = (midiNumber: number) => {
    if (activeNotes[midiNumber] || !isRecording) {
      return
    }
    console.log('handlePlayNoteInput', activeNotes, midiNumber, recordingTimeMilliseconds)
    setActiveNotes({...activeNotes, [midiNumber]: true})
    recordKeyboard?.startNote(midiNote(midiNumber), recordingTimeMilliseconds)
  }
  const handleStopNoteInput = (midiNumber: number) => {
    if (!activeNotes[midiNumber] || !isRecording) {
      return
    }
    console.log('handleStopNoteInput', activeNotes, midiNumber, recordingTimeMilliseconds)
    setActiveNotes({...activeNotes, [midiNumber]: false})
    recordKeyboard?.stopNote(midiNote(midiNumber), recordingTimeMilliseconds)
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
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
