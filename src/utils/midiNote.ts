const notes = "C C#D D#E F F#G G#A A#B "

export const midiNote = (midiNumber: number): string => {
    // const octave = Math.floor((midiNumber / 12) - 1)
    const startNote = (midiNumber % 12) * 2
    const note = notes.substring(startNote, startNote + 2).trimEnd()

    return note
}

const midiNoteToNumberMap: Record<string, number> = {
    'C': 48,
    'C#': 49,
    'D': 50,
    'D#': 51,
    'E': 52,
    'F': 53,
    'F#': 54,
    'G': 55,
    'G#': 56,
    'A': 57,
    'A#': 58,
    'B': 59
}

export const midiNumber = (midiNote: string): number => {
    return midiNoteToNumberMap[midiNote] || 48
}
