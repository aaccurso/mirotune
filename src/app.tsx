import { Frame } from '@mirohq/websdk-types';
import React, {useState, useEffect} from 'react';
import ReactDOM from 'react-dom';
import SoundfontProvider from './components/SoundfontProvider';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { keyBoards } from './script-board'
import { midiNote, midiNumber } from './utils/midiNote';

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
  getFrame(): Frame;
}

type ActiveNotes = Record<number, boolean>

function App() {
  const keyboards = keyBoards()
  const [tuneFrames, setTuneFrames] = useState<Frame[]>([])
  const [recordKeyboard, setRecordKeyboard] = useState<BoardKeyboard>()
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTimeMilliseconds, setRecordingTimeMilliseconds] = useState(0)
  const [activeNotes, setActiveNotes] = useState<ActiveNotes>({})
  const [playingNotes, setPlayingNotes] = useState<number[]>()

  useEffect(() => {
    console.log('recording useEffect')
    if (!isRecording) {
      return
    }
    const interval = setInterval(() => {
      setRecordingTimeMilliseconds(recordingTimeMilliseconds => recordingTimeMilliseconds + RECORDING_INTERVAL_MS);
    }, RECORDING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    console.log('tune frames useEffect')
    async function getTuneFrames() {
      const frames = await miro.board.get({type: 'frame'})
      setTuneFrames(frames)
    }
    getTuneFrames()
  }, [])


  const startRecording = async () => {
    // const viewport = await miro.board.viewport.get()
    // const center = {
    //   x: viewport.x + viewport.width,
    //   y: viewport.y + viewport.height
    // }
    const recordKeyboard = await keyboards.createKeyboard(`MiroTune - ${Date.now()}`)
    const newTuneFrame = recordKeyboard.getFrame()
    setTuneFrames([...tuneFrames, newTuneFrame])
    setRecordKeyboard(recordKeyboard)
    recordKeyboard.startRecording()
    setIsRecording(true)
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

  const handlePlay = async (tuneFrame: Frame) => {
    const keyboard = await keyboards.prepareKeyboard(tuneFrame)
    keyboard.play((note: string, duration: number) => {
      console.log('playNote', note)
      const noteNumber = midiNumber(note)
      setPlayingNotes(prevNotes => [...prevNotes || [], noteNumber])
      setTimeout(() => {
        console.log('stopNote', note)
        setPlayingNotes(prevNotes => prevNotes?.filter(note => note !== noteNumber))
      }, duration)
    })
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
              activeNotes={playingNotes}
              disabled={isLoading}
              playNote={playNote}
              stopNote={stopNote}
              onPlayNoteInput={handlePlayNoteInput}
              onStopNoteInput={handleStopNoteInput}
            />
          )}
        />
      </div>
      <div className="cs1 ce7">
        Recording time: {recordingTimeMilliseconds} ms
      </div>
      <div className="cs8 ce12">
        <button className="button button-primary" type="button" onClick={() => isRecording ? stopRecording() : startRecording()}>
          {isRecording ? 'Done' : 'Record'}
        </button>
      </div>
      {tuneFrames.length > 0 && (
        <div className="cs1 ce12">
          <hr className="hr"/>
          <h3 className="h3">Tunes in this board</h3>
          {tuneFrames.map((tuneFrame) => {
            return (
              <div className="grid" style={{"marginBottom": '10px'}} key={tuneFrame.id}>
                <div className="cs1 ce9">
                  {tuneFrame.title}
                </div>
                <div className="cs10 ce12">
                  <button className="button button-primary button-small" type="button" onClick={() => handlePlay(tuneFrame)}>Play</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
