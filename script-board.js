async function keyBoards() {
    const NOTE_WIDTH = 430
    const NOTE_HEIGHT= 100
    const FRAME_BORDER = 100
    const RECORD_AREA_OFFSET = (2*FRAME_BORDER) + NOTE_WIDTH
    const SIZE_PER_MILISECOND = 0.5

    async function createFrame() {
        return await miro.board.createFrame({
            "title": "Frame 1",
            "style": {
            "fillColor": "#ffffff"
            },
            "x": 315,
            "y": 502.5,
            "height": (NOTE_HEIGHT * 7) + 200,
            "width": 630
        })
    }

    async function createBoardKeys(frame) {
        const offsetX = frame.x - (frame.width/2)
        const offsetY = frame.y - (frame.height/2)
    
        const whiteNote = {
            "content": "<p>NoteName</p>",
            "shape": "rectangle",
            "style": {
              "fillColor": "#ffffff",
              "fontFamily": "open_sans",
              "fontSize": 28,
              "textAlign": "center",
              "textAlignVertical": "bottom"
            },
            "x": 0,
            "y": 0,
            "width": NOTE_HEIGHT,
            "height": NOTE_WIDTH,
            "rotation": -90
        }
        const blackNote = {
            "content": "",
            "shape": "rectangle",
            "style": {
                "fillColor": "#1a1a1a",
                "fontFamily": "open_sans",
                "fontSize": 28,
                "textAlign": "center",
                "textAlignVertical": "middle",
            },
            "x": 0,
            "y": 0,
            "width": (whiteNote.width/3) * 2,
            "height": (whiteNote.height/3) * 2,
            "rotation": 90
        }
        
        let newPositionX = FRAME_BORDER + offsetX + (whiteNote.height/2)
        let newPositionY = FRAME_BORDER + offsetY + (whiteNote.width/2)
        
        const notes = {}
        for(const note of ["C","D","E","F","G","A","B"]) {
            const shapeCreated = await miro.board.createShape({
                ...whiteNote,
                content: `<p>${note}</p>`,
                x: newPositionX,
                y: newPositionY,
            })
            frame.add(shapeCreated)
            notes[note] = shapeCreated
            newPositionY += whiteNote.width
        }
    
        newPositionX = FRAME_BORDER + offsetX + (blackNote.height/2)
        newPositionY = FRAME_BORDER + offsetY + (blackNote.width/2) + blackNote.width
    
        for(const note of ["C#","D#",null,"F#","G#","A#", null]) {
            if(note) {
                const shapeCreated = await miro.board.createShape({
                    ...blackNote,
                    content: `<p>${note}</p>`,
                    x: newPositionX,
                    y: newPositionY,
                })
                frame.add(shapeCreated)
                notes[note] = shapeCreated
            }
            newPositionY += blackNote.width + (whiteNote.width/3)
        }
    
        return notes
    }

    function getRecordFromFrame(frame) {
        const childrens = frame.getChildren()
        const recorded = {}

        for(const children of childrens ) {
            if(children.shape === "round_rectangle") {
                const startTime = (children.x - RECORD_AREA_OFFSET) * SIZE_PER_MILISECOND
                recorded[startTime] = children
            }
        }

        return recorded
    }
    
    function getNotesFromFrame(frame) {
        const childrens = frame.getChildren()
        const notes = {}
    
        for(const children of childrens ) {
            if(children.shape === "rectangle") {
                notes[children.content.replace("<p>(.*)</p>", "$1")] = children
            }
        }
    
        return notes
    }

    function buildKeyboad(frame, notes) {
        const frame = frame
        const notes = notes || getNotesFromFrame(frame)
        return {
            startRecording() {
                
            },
            stopRecording() {
                
            },
            startNote(note, time) {
    
            },
            stopNote(note, time) {
    
            },
            play() {
                const recorded = getRecordFromFrame(frame)
            },
            pause() {
    
            },
            stopPlaying() {
                
            },
        }
    }

    return {
        createKeyboard: async () => {
            const frame = await createFrame()
            const notes = await createBoardKeys(frame)
            return buildKeyboad(frame, notes)
        }
    }
}
