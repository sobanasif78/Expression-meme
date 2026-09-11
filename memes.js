// ---------------------------------------------------------------
// MEME & GESTURE CONFIG — Cat Meme Edition (all memes wired in)
// ---------------------------------------------------------------
// Each expression/gesture has:
//   - sound: key into app.js's SOUND_LIBRARY (synthesized, no files needed)
//   - how: plain-English instructions shown in the on-screen guide
//   - variants: array of { emoji, label, caption, image? or video? } —
//     a random one is picked each time the mood changes. If a variant
//     has an `image` or `video`, that's shown; otherwise the emoji.
// ---------------------------------------------------------------

const MEME_CONFIG = {
  expressions: {
    happy: {
      sound: "happy",
      how: "Smile naturally at the camera",
      variants: [
        { emoji: "😻", label: "Happy", caption: "Heart-eyes cat mode: ON", image: "memes/uwucat.jpg" },
        { emoji: "😸", label: "Happy", caption: "I can haz good vibes", image: "memes/uwucatt.jpg" },
        { emoji: "😹", label: "Happy", caption: "Pointing and laughing at you", image: "memes/laugh and point .jpg" },
        { emoji: "🌀", label: "Happy", caption: "Zoomies engaged", video: "memes/spin cat.mov" }
      ]
    },
    sad: {
      sound: "sad",
      how: "Frown or pout",
      variants: [
        { emoji: "😿", label: "Sad", caption: "Crying cat has entered the chat" },
        { emoji: "🥲", label: "Sad", caption: "No treats. It's fine. Everything is fine." },
        { emoji: "🙁", label: "Sad", caption: "Monday face, but make it feline" }
      ]
    },
    angry: {
      sound: "angry",
      how: "Furrow your brows, look angry",
      variants: [
        { emoji: "😾", label: "Angry", caption: "Grumpy Cat has logged on", image: "memes/punchcat.jpg" },
        { emoji: "🤬", label: "Angry", caption: "When the food bowl is empty" },
        { emoji: "💢", label: "Angry", caption: "Someone moved my sunny spot" }
      ]
    },
    surprised: {
      sound: "surprised",
      how: "Raise eyebrows, open mouth wide",
      variants: [
        { emoji: "🙀", label: "Surprised", caption: "Surprised cat face, activated", image: "memes/huh.png" },
        { emoji: "😳", label: "Surprised", caption: "Wait, WHAT?! (cat version)", image: "memes/cat.jpg" }
      ]
    },
    disgusted: {
      sound: "disgusted",
      how: "Scrunch your nose like something smells bad",
      variants: [
        { emoji: "🙅", label: "Disgusted", caption: "Hard no from this cat", video: "memes/shaking head .mov" },
        { emoji: "😖", label: "Disgusted", caption: "Bath time face" }
      ]
    },
    fearful: {
      sound: "fearful",
      how: "Wide eyes, tense/scared expression",
      variants: [
        { emoji: "😨", label: "Fearful", caption: "The vacuum cleaner is out" },
        { emoji: "😰", label: "Fearful", caption: "Vet appointment energy" }
      ]
    },
    neutral: {
      sound: "neutral",
      how: "Relaxed, no strong expression",
      variants: [
        { emoji: "🐱", label: "Neutral", caption: "Judging you silently", image: "memes/pokercat.jpg" },
        { emoji: "🤷", label: "Neutral", caption: "Iunno, ask someone else", image: "memes/iunno cat.jpg" },
        { emoji: "🧑‍🏫", label: "Professor Cat", caption: "Explains why you're wrong", image: "memes/profcat.jpg" },
        { emoji: "🎓", label: "Professor Cat", caption: "Citation needed", image: "memes/professorcat.jpg" }
      ]
    }
  },

  gestures: {
    index_up: {
      sound: "shush",
      how: "One hand up, index finger only, tip resting near your mouth",
      variants: [
        { emoji: "☝️", label: "Shush", caption: "Ceiling cat is watching", image: "memes/shhcat.jpg" },
        { emoji: "🤫", label: "Shush", caption: "Hold that thought, hooman" }
      ]
    },
    bicep_flex: {
      sound: "flex",
      how: "Bend an elbow ~90° with your fist at or above shoulder height",
      variants: [
        { emoji: "💪", label: "Flex", caption: "Buff cat, we all gonna make it", video: "memes/rocky cat.mov" },
        { emoji: "🦾", label: "Flex", caption: "Gains detected (mostly fur)" }
      ]
    },
    finger_mouth: {
      sound: "shook",
      how: "Touch your index fingertip to your mouth",
      variants: [
        { emoji: "🙀", label: "Shook", caption: "When the laser pointer disappears" },
        { emoji: "😬", label: "Shook", caption: "Knocked the cup off the table on purpose" }
      ]
    },
    fist: {
      sound: "angry",
      how: "Make a fist with one hand, thumb tucked in",
      variants: [
        { emoji: "😾", label: "Stoic Cat", caption: "Do not pet. Do not speak.", image: "memes/punchcat.jpg" },
        { emoji: "✊", label: "Stoic Cat", caption: "Silent judgment fist" }
      ]
    },
    rockstar: {
      sound: "flex",
      how: "Thumb and pinky out, other fingers curled",
      variants: [
        { emoji: "🤘", label: "Rockstar Cat", caption: "Knocking things off shelves since forever" },
        { emoji: "🎸", label: "Rockstar Cat", caption: "3am zoomies concert tour" }
      ]
    },
    open_palm: {
      sound: "shook",
      how: "Hold one hand up, all 5 fingers spread, away from your face",
      variants: [
        { emoji: "🖐️", label: "No Monies", caption: "i HAVE NO MONIES for treats", image: "memes/hand stretched out, palm facing up .jpg" },
        { emoji: "🤲", label: "No Monies", caption: "Empty paws, empty bowl", video: "memes/two palms up.mov" }
      ]
    },
    fingers_together: {
      sound: "shook",
      how: "Both hands up, index fingers extended, tips touching",
      variants: [
        { emoji: "🤌", label: "Muehehe", caption: "Plotting something. Don't ask.", image: "memes/fingers together muehehe .jpg" },
        { emoji: "😼", label: "Muehehe", caption: "Excellent... *steeples paws*" }
      ]
    },
    hands_above_head: {
      sound: "sad",
      how: "Raise both hands above the top of your head",
      variants: [
        { emoji: "😭", label: "Devastated Cat", caption: "The vet appointment was today", image: "memes/two hands on head .jpg" },
        { emoji: "🙀", label: "Devastated Cat", caption: "They're all out of the good treats" }
      ]
    },
    hands_beside_face: {
      sound: "fearful",
      how: "Raise both hands to face height, beside your head (not above it)",
      variants: [
        { emoji: "😩", label: "Crash Out Cat", caption: "It's not the reaction you think it is", image: "memes/crashout cat .jpg" },
        { emoji: "🫨", label: "Crash Out Cat", caption: "Full meltdown, no notes" }
      ]
    },
    hand_cover_face: {
      sound: "shook",
      how: "Bring one hand up over your face, roughly covering it",
      variants: [
        { emoji: "🙈", label: "Kidnap Cat", caption: "You didn't see anything", image: "memes/hand cover face .jpg" }
      ]
    },
    side_eye: {
      sound: "disgusted",
      how: "Turn your head to one side while facing the camera",
      variants: [
        { emoji: "👀", label: "Side Eye Cat", caption: "I heard that.", image: "memes/side eye cat.jpg" },
        { emoji: "😒", label: "Side Eye Cat", caption: "Mmhm. Sure.", image: "memes/side eye.png" }
      ]
    }
  }
};

const GESTURE_MAP = MEME_CONFIG.gestures;

const MEME_MAP = {
  ...MEME_CONFIG.expressions,
  ...MEME_CONFIG.gestures
};

const EXPRESSION_ORDER = [
  "happy", "sad", "angry", "surprised", "disgusted", "fearful", "neutral"
];
