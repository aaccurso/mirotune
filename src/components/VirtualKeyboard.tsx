import React, {useEffect} from 'react'
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';

interface IProps {
    playNote: (midiNumber: number) => any
    stopNote: (midiNumber: number) => any
    disabled: boolean
}

export const VirtualKeyboard: React.FC<IProps> = ({playNote, stopNote, disabled}) => {
    const firstNote = MidiNumbers.fromNote('c3');
    const lastNote = MidiNumbers.fromNote('g4');
    const keyboardShortcuts = KeyboardShortcuts.create({
        firstNote: firstNote,
        lastNote: lastNote,
        keyboardConfig: KeyboardShortcuts.HOME_ROW,
    });

    return (
        <Piano
            noteRange={{ first: firstNote, last: lastNote }}
            playNote={playNote}
            stopNote={stopNote}
            disabled={disabled}
            width={300}
            keyboardShortcuts={keyboardShortcuts}
        />
    );
}
