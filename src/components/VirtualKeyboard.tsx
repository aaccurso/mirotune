import React, {useState} from 'react'
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';
import './VirtualKeyboard.css'

interface IProps {
    playNote: (midiNumber: number) => any
    stopNote: (midiNumber: number) => any
    onPlayNoteInput: (midiNumber: number) => any
    onStopNoteInput: (midiNumber: number) => any
    activeNotes?: number[]
    disabled: boolean
}

export const VirtualKeyboard: React.FC<IProps> = ({playNote, stopNote, onPlayNoteInput, onStopNoteInput, activeNotes, disabled}) => {
    const firstNote = MidiNumbers.fromNote('c3');
    const lastNote = MidiNumbers.fromNote('g4');
    const keyboardShortcuts = KeyboardShortcuts.create({
        firstNote: firstNote,
        lastNote: lastNote,
        keyboardConfig: KeyboardShortcuts.HOME_ROW,
    });

    return (
        <Piano
            className="MiroTheme"
            activeNotes={activeNotes}
            noteRange={{ first: firstNote, last: lastNote }}
            onPlayNoteInput={onPlayNoteInput}
            onStopNoteInput={onStopNoteInput}
            playNote={playNote}
            stopNote={stopNote}
            disabled={disabled}
            width={304}
            keyWidthToHeight={0.2}
            keyboardShortcuts={keyboardShortcuts}
        />
    );
}
