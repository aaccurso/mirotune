const notes = "C C#D D#E F F#G G#A A#B "

export const midiNote = (midiNumber: number): string => {
    const octave = Math.floor((midiNumber / 12) - 1)
    const startNote = (midiNumber % 12) * 2
    const note = notes.substring(startNote, startNote + 2).trimEnd()

    return note
}
