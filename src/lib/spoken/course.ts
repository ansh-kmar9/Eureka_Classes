/**
 * The Spoken English course. It is part of the app, so it is the same for every student and
 * needs no teacher to set up. Phrases have a Hindi meaning, because that is what a learner
 * needs most; quizzes and speaking practice are built from them automatically.
 *
 * To add a lesson, append it to a unit below. Lesson ids ("level-unit-lesson") are saved in
 * students' progress, so never renumber a lesson that already exists.
 */

export interface Bilingual {
  en: string;
  hi: string;
}

export interface Phrase {
  en: string;
  hi: string;
}

export interface Lesson {
  /** Stable id, "level-unit-lesson", for example "2-1-3". */
  id: string;
  title: Bilingual;
  /** A short pointer on pronunciation, grammar or usage, shown before the lesson starts. */
  tip: Bilingual;
  phrases: Phrase[];
}

export interface Unit {
  id: string;
  title: Bilingual;
  lessons: Lesson[];
}

export interface Level {
  id: number;
  title: Bilingual;
  subtitle: Bilingual;
  units: Unit[];
}

const p = (en: string, hi: string): Phrase => ({ en, hi });

export const COURSE: Level[] = [
  {
    id: 1,
    title: { en: "Starting Out", hi: "शुरुआत" },
    subtitle: { en: "Greetings, introductions and everyday basics", hi: "अभिवादन, परिचय और रोज़ की बुनियादी बातें" },
    units: [
      {
        id: "1-1",
        title: { en: "Hello and Introductions", hi: "नमस्ते और परिचय" },
        lessons: [
          {
            id: "1-1-1",
            title: { en: "Greetings", hi: "अभिवादन" },
            tip: {
              en: "Say \"Good morning\" until about noon, \"Good afternoon\" until the evening, and \"Good night\" only when someone is going to sleep or you are leaving at night.",
              hi: "\"Good morning\" दोपहर तक, \"Good afternoon\" शाम तक बोलें। \"Good night\" तब बोलें जब कोई सोने जा रहा हो या आप रात को विदा ले रहे हों।",
            },
            phrases: [
              p("Hello!", "नमस्ते!"),
              p("Good morning.", "सुप्रभात।"),
              p("Good afternoon.", "शुभ दोपहर।"),
              p("Good evening.", "शुभ संध्या।"),
              p("Good night.", "शुभ रात्रि।"),
              p("How are you?", "आप कैसे हैं?"),
              p("I am fine, thank you.", "मैं ठीक हूँ, धन्यवाद।"),
              p("And you?", "और आप?"),
            ],
          },
          {
            id: "1-1-2",
            title: { en: "Introducing Yourself", hi: "अपना परिचय देना" },
            tip: {
              en: "Use \"I am\" or \"My name is\" to say who you are. Speak slowly and smile: a clear, calm voice makes a good first impression.",
              hi: "अपने बारे में बताने के लिए \"I am\" या \"My name is\" बोलें। धीरे और मुस्कुराकर बोलें, साफ़ और शांत आवाज़ से अच्छा प्रभाव पड़ता है।",
            },
            phrases: [
              p("My name is Rohan.", "मेरा नाम रोहन है।"),
              p("What is your name?", "आपका नाम क्या है?"),
              p("Nice to meet you.", "आपसे मिलकर अच्छा लगा।"),
              p("I am from Bihar.", "मैं बिहार से हूँ।"),
              p("Where are you from?", "आप कहाँ से हैं?"),
              p("I am a student.", "मैं एक विद्यार्थी हूँ।"),
              p("I study in class nine.", "मैं नौवीं कक्षा में पढ़ता हूँ।"),
              p("I live in Patna.", "मैं पटना में रहता हूँ।"),
            ],
          },
          {
            id: "1-1-3",
            title: { en: "Polite Words", hi: "विनम्र शब्द" },
            tip: {
              en: "\"Please\", \"thank you\" and \"sorry\" are the most powerful words in English. Use them often, even with friends.",
              hi: "\"Please\", \"thank you\" और \"sorry\" अंग्रेज़ी के सबसे असरदार शब्द हैं। दोस्तों के साथ भी इन्हें अक्सर बोलें।",
            },
            phrases: [
              p("Please.", "कृपया।"),
              p("Thank you very much.", "आपका बहुत धन्यवाद।"),
              p("You are welcome.", "आपका स्वागत है।"),
              p("Sorry.", "माफ़ कीजिए।"),
              p("Excuse me.", "सुनिए, माफ़ कीजिए।"),
              p("May I come in?", "क्या मैं अंदर आ सकता हूँ?"),
              p("Can you help me?", "क्या आप मेरी मदद कर सकते हैं?"),
              p("No problem.", "कोई बात नहीं।"),
            ],
          },
        ],
      },
      {
        id: "1-2",
        title: { en: "Me and My World", hi: "मैं और मेरी दुनिया" },
        lessons: [
          {
            id: "1-2-1",
            title: { en: "Family", hi: "परिवार" },
            tip: {
              en: "Use \"he\" for a boy or man, \"she\" for a girl or woman, and \"my\" for things that belong to you: my mother, my brother.",
              hi: "लड़के या पुरुष के लिए \"he\", लड़की या महिला के लिए \"she\" और अपनी चीज़ों के लिए \"my\" बोलें: my mother, my brother.",
            },
            phrases: [
              p("This is my mother.", "यह मेरी माँ हैं।"),
              p("He is my father.", "वे मेरे पिता हैं।"),
              p("I have one brother.", "मेरा एक भाई है।"),
              p("She is my sister.", "वह मेरी बहन है।"),
              p("My grandfather is old.", "मेरे दादाजी बुज़ुर्ग हैं।"),
              p("We are a small family.", "हम एक छोटा परिवार हैं।"),
              p("My father is a farmer.", "मेरे पिता किसान हैं।"),
              p("I love my family.", "मैं अपने परिवार से प्यार करता हूँ।"),
            ],
          },
          {
            id: "1-2-2",
            title: { en: "Days, Numbers and Time", hi: "दिन, गिनती और समय" },
            tip: {
              en: "For the time, say \"It is\" and then the hour: \"It is ten o'clock.\" Add \"half past\" for thirty minutes.",
              hi: "समय बताने के लिए \"It is\" के बाद घंटा बोलें: \"It is ten o'clock.\" आधे घंटे के लिए \"half past\" जोड़ें।",
            },
            phrases: [
              p("One, two, three, four, five.", "एक, दो, तीन, चार, पाँच।"),
              p("Today is Monday.", "आज सोमवार है।"),
              p("What day is it today?", "आज कौन सा दिन है?"),
              p("What time is it?", "क्या समय हुआ है?"),
              p("It is half past ten.", "साढ़े दस बजे हैं।"),
              p("I wake up at six o'clock.", "मैं छह बजे उठता हूँ।"),
              p("See you tomorrow.", "कल मिलते हैं।"),
              p("The school starts at eight.", "स्कूल आठ बजे शुरू होता है।"),
            ],
          },
          {
            id: "1-2-3",
            title: { en: "Things Around Me", hi: "मेरे आसपास की चीज़ें" },
            tip: {
              en: "Use \"this\" for something near you and \"that\" for something far away. Commands like \"Open your book\" are polite when you add \"please\".",
              hi: "पास की चीज़ के लिए \"this\" और दूर की चीज़ के लिए \"that\" बोलें। \"Open your book\" जैसे आदेश में \"please\" जोड़ने से वह विनम्र हो जाता है।",
            },
            phrases: [
              p("This is a book.", "यह एक किताब है।"),
              p("That is my bag.", "वह मेरा बैग है।"),
              p("The pen is blue.", "कलम नीली है।"),
              p("What is this?", "यह क्या है?"),
              p("Open your book.", "अपनी किताब खोलिए।"),
              p("Close the door.", "दरवाज़ा बंद कीजिए।"),
              p("Please sit down.", "कृपया बैठ जाइए।"),
              p("Please stand up.", "कृपया खड़े हो जाइए।"),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 2,
    title: { en: "Daily Conversations", hi: "रोज़मर्रा की बातचीत" },
    subtitle: { en: "Shopping, directions, food and school life", hi: "खरीदारी, रास्ता पूछना, खाना और स्कूल का जीवन" },
    units: [
      {
        id: "2-1",
        title: { en: "Out and About", hi: "बाहर घूमना" },
        lessons: [
          {
            id: "2-1-1",
            title: { en: "At the Shop", hi: "दुकान पर" },
            tip: {
              en: "\"Can I have...?\" and \"Do you have...?\" are the easiest ways to ask for something in a shop.",
              hi: "दुकान पर कुछ माँगने के सबसे आसान तरीके हैं: \"Can I have...?\" और \"Do you have...?\"",
            },
            phrases: [
              p("How much is this?", "यह कितने का है?"),
              p("It is fifty rupees.", "यह पचास रुपये का है।"),
              p("Can I have a kilo of apples?", "क्या मुझे एक किलो सेब मिल सकते हैं?"),
              p("That is too expensive.", "यह बहुत महँगा है।"),
              p("Do you have a smaller size?", "क्या आपके पास छोटा साइज़ है?"),
              p("I will take this one.", "मैं यही लूँगा।"),
              p("Here is the money.", "ये रहे पैसे।"),
              p("Please give me the bill.", "कृपया मुझे बिल दीजिए।"),
            ],
          },
          {
            id: "2-1-2",
            title: { en: "Asking for Directions", hi: "रास्ता पूछना" },
            tip: {
              en: "Learn the four direction words: straight, left, right and near. With them you can ask for and give almost any direction.",
              hi: "चार दिशा-शब्द सीखें: straight, left, right और near। इनसे आप लगभग कोई भी रास्ता पूछ और बता सकते हैं।",
            },
            phrases: [
              p("Where is the bus stand?", "बस स्टैंड कहाँ है?"),
              p("Go straight.", "सीधे जाइए।"),
              p("Turn left at the corner.", "मोड़ पर बाएँ मुड़िए।"),
              p("Turn right at the traffic light.", "ट्रैफ़िक लाइट पर दाएँ मुड़िए।"),
              p("It is near the post office.", "यह डाकघर के पास है।"),
              p("How far is the station?", "स्टेशन कितनी दूर है?"),
              p("It is five minutes from here.", "यह यहाँ से पाँच मिनट की दूरी पर है।"),
              p("Thank you for your help.", "आपकी मदद के लिए धन्यवाद।"),
            ],
          },
          {
            id: "2-1-3",
            title: { en: "Food and Eating", hi: "खाना-पीना" },
            tip: {
              en: "\"I would like...\" sounds more polite than \"I want...\". Use it when you order food or ask for something.",
              hi: "\"I would like...\" बोलना \"I want...\" से ज़्यादा विनम्र लगता है। खाना मँगाते समय या कुछ माँगते समय इसका इस्तेमाल करें।",
            },
            phrases: [
              p("I am hungry.", "मुझे भूख लगी है।"),
              p("I am thirsty.", "मुझे प्यास लगी है।"),
              p("What would you like to eat?", "आप क्या खाना पसंद करेंगे?"),
              p("I would like a cup of tea.", "मुझे एक कप चाय चाहिए।"),
              p("The food is delicious.", "खाना बहुत स्वादिष्ट है।"),
              p("Could I have some water, please?", "कृपया क्या मुझे थोड़ा पानी मिल सकता है?"),
              p("I do not like spicy food.", "मुझे तीखा खाना पसंद नहीं।"),
              p("It was a tasty meal.", "वह स्वादिष्ट भोजन था।"),
            ],
          },
        ],
      },
      {
        id: "2-2",
        title: { en: "School Life", hi: "स्कूल का जीवन" },
        lessons: [
          {
            id: "2-2-1",
            title: { en: "In the Classroom", hi: "कक्षा में" },
            tip: {
              en: "If you do not understand, do not stay silent. \"Could you repeat that, please?\" is a perfectly polite thing to say.",
              hi: "समझ न आए तो चुप न रहें। \"Could you repeat that, please?\" कहना पूरी तरह विनम्र है।",
            },
            phrases: [
              p("May I ask a question, sir?", "सर, क्या मैं एक सवाल पूछ सकता हूँ?"),
              p("I did not understand.", "मुझे समझ नहीं आया।"),
              p("Could you repeat that, please?", "कृपया क्या आप इसे दोहरा सकते हैं?"),
              p("What does this word mean?", "इस शब्द का क्या मतलब है?"),
              p("I have finished my homework.", "मैंने अपना गृहकार्य पूरा कर लिया है।"),
              p("I forgot my notebook.", "मैं अपनी कॉपी भूल गया।"),
              p("May I go to the washroom?", "क्या मैं शौचालय जा सकता हूँ?"),
              p("Thank you for teaching us.", "हमें पढ़ाने के लिए धन्यवाद।"),
            ],
          },
          {
            id: "2-2-2",
            title: { en: "Hobbies and Interests", hi: "शौक और रुचियाँ" },
            tip: {
              en: "After \"like\" or \"enjoy\", add an \"-ing\" word: I like playing, I enjoy reading.",
              hi: "\"like\" या \"enjoy\" के बाद \"-ing\" वाला शब्द लगाएँ: I like playing, I enjoy reading.",
            },
            phrases: [
              p("What do you like to do?", "आपको क्या करना पसंद है?"),
              p("I like playing cricket.", "मुझे क्रिकेट खेलना पसंद है।"),
              p("I enjoy reading stories.", "मुझे कहानियाँ पढ़ना अच्छा लगता है।"),
              p("My favourite subject is science.", "मेरा पसंदीदा विषय विज्ञान है।"),
              p("I watch cartoons on Sunday.", "मैं रविवार को कार्टून देखता हूँ।"),
              p("Do you like music?", "क्या आपको संगीत पसंद है?"),
              p("I am learning to draw.", "मैं चित्र बनाना सीख रहा हूँ।"),
              p("We play together after school.", "हम स्कूल के बाद साथ खेलते हैं।"),
            ],
          },
          {
            id: "2-2-3",
            title: { en: "Making Plans", hi: "योजना बनाना" },
            tip: {
              en: "\"Shall we...?\" and \"Let us...\" are friendly ways to suggest a plan. To say no politely, try \"Maybe next time.\"",
              hi: "योजना सुझाने के दोस्ताना तरीके हैं \"Shall we...?\" और \"Let us...\"। विनम्रता से मना करने के लिए \"Maybe next time.\" बोलें।",
            },
            phrases: [
              p("Shall we play football today?", "क्या हम आज फ़ुटबॉल खेलें?"),
              p("Let us meet at four o'clock.", "चलिए चार बजे मिलते हैं।"),
              p("I am free on Saturday.", "मैं शनिवार को खाली हूँ।"),
              p("I cannot come today.", "मैं आज नहीं आ सकता।"),
              p("Maybe next time.", "शायद अगली बार।"),
              p("That sounds great!", "यह तो बढ़िया लगता है!"),
              p("What time shall we meet?", "हम कितने बजे मिलें?"),
              p("I will call you tonight.", "मैं आज रात तुम्हें फ़ोन करूँगा।"),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 3,
    title: { en: "Express Yourself", hi: "अपनी बात कहें" },
    subtitle: { en: "Past, future, opinions and real-life situations", hi: "बीता कल, आने वाला कल, राय और असली ज़िंदगी के हालात" },
    units: [
      {
        id: "3-1",
        title: { en: "Past and Future", hi: "बीता कल और आने वाला कल" },
        lessons: [
          {
            id: "3-1-1",
            title: { en: "Talking About Yesterday", hi: "बीते कल की बातें" },
            tip: {
              en: "For things that happened in the past, most verbs change: go becomes went, see becomes saw. \"Did\" helps in questions and in \"did not\".",
              hi: "बीती बातों के लिए ज़्यादातर क्रियाएँ बदल जाती हैं: go का went, see का saw। प्रश्न और \"did not\" में \"did\" काम आता है।",
            },
            phrases: [
              p("What did you do yesterday?", "कल आपने क्या किया?"),
              p("I went to the market.", "मैं बाज़ार गया था।"),
              p("We watched a movie.", "हमने एक फ़िल्म देखी।"),
              p("I did not sleep well.", "मैं ठीक से सो नहीं पाया।"),
              p("She visited her grandmother.", "वह अपनी दादी से मिलने गई।"),
              p("It was a wonderful day.", "वह एक शानदार दिन था।"),
              p("I have already eaten.", "मैं पहले ही खा चुका हूँ।"),
              p("I studied for two hours.", "मैंने दो घंटे पढ़ाई की।"),
            ],
          },
          {
            id: "3-1-2",
            title: { en: "Plans for Tomorrow", hi: "कल की योजनाएँ" },
            tip: {
              en: "Use \"will\" for decisions and promises, and \"going to\" for plans you have already made.",
              hi: "फ़ैसलों और वादों के लिए \"will\" और पहले से तय योजनाओं के लिए \"going to\" का इस्तेमाल करें।",
            },
            phrases: [
              p("What are you going to do tomorrow?", "कल आप क्या करने वाले हैं?"),
              p("I am going to study maths.", "मैं गणित पढ़ने वाला हूँ।"),
              p("We will visit a museum.", "हम एक संग्रहालय जाएँगे।"),
              p("I will help my mother.", "मैं अपनी माँ की मदद करूँगा।"),
              p("It might rain tomorrow.", "कल बारिश हो सकती है।"),
              p("I hope to pass with good marks.", "मुझे उम्मीद है कि मैं अच्छे अंकों से पास होऊँगा।"),
              p("What will you do after school?", "स्कूल के बाद आप क्या करेंगे?"),
              p("Next month I will start a new course.", "अगले महीने मैं एक नया कोर्स शुरू करूँगा।"),
            ],
          },
          {
            id: "3-1-3",
            title: { en: "Giving Your Opinion", hi: "अपनी राय देना" },
            tip: {
              en: "Start with \"I think\" or \"In my opinion\" to share your view without sounding rude.",
              hi: "अपनी बात विनम्रता से रखने के लिए \"I think\" या \"In my opinion\" से शुरू करें।",
            },
            phrases: [
              p("I think this is a good idea.", "मुझे लगता है यह अच्छा विचार है।"),
              p("In my opinion, reading is important.", "मेरी राय में पढ़ना ज़रूरी है।"),
              p("I agree with you.", "मैं आपसे सहमत हूँ।"),
              p("I do not agree.", "मैं सहमत नहीं हूँ।"),
              p("That is a good point.", "यह अच्छी बात है।"),
              p("Could you explain why?", "क्या आप समझा सकते हैं क्यों?"),
              p("I see what you mean.", "मैं समझ गया आप क्या कहना चाहते हैं।"),
              p("Let us find a solution together.", "चलिए मिलकर कोई हल निकालें।"),
            ],
          },
        ],
      },
      {
        id: "3-2",
        title: { en: "Real-Life Situations", hi: "असली ज़िंदगी के हालात" },
        lessons: [
          {
            id: "3-2-1",
            title: { en: "Phone Calls", hi: "फ़ोन पर बातचीत" },
            tip: {
              en: "On the phone you cannot see the other person, so speak clearly and a little slowly. Say \"This is...\" to introduce yourself, not \"I am...\".",
              hi: "फ़ोन पर सामने वाला दिखता नहीं, इसलिए साफ़ और थोड़ा धीरे बोलें। अपना परिचय देने के लिए \"I am...\" की जगह \"This is...\" बोलें।",
            },
            phrases: [
              p("Hello, who is speaking?", "हैलो, कौन बोल रहा है?"),
              p("This is Anita speaking.", "मैं अनीता बोल रही हूँ।"),
              p("May I speak to Rahul, please?", "कृपया क्या मैं राहुल से बात कर सकता हूँ?"),
              p("He is not at home right now.", "वह अभी घर पर नहीं है।"),
              p("Can I take a message?", "क्या मैं संदेश ले सकता हूँ?"),
              p("Please call me back later.", "कृपया बाद में मुझे वापस फ़ोन कीजिए।"),
              p("I cannot hear you clearly.", "मुझे आपकी आवाज़ साफ़ नहीं आ रही।"),
              p("Thanks for calling. Goodbye!", "फ़ोन करने के लिए धन्यवाद। अलविदा!"),
            ],
          },
          {
            id: "3-2-2",
            title: { en: "Feeling Unwell", hi: "तबीयत ठीक न होना" },
            tip: {
              en: "To describe pain, say \"I have a...\": I have a headache, I have a fever. \"Should\" gives friendly advice.",
              hi: "दर्द बताने के लिए \"I have a...\" बोलें: I have a headache, I have a fever. सलाह देने के लिए \"should\" का इस्तेमाल करें।",
            },
            phrases: [
              p("I do not feel well.", "मेरी तबीयत ठीक नहीं है।"),
              p("I have a headache.", "मेरे सिर में दर्द है।"),
              p("I have had a fever since yesterday.", "मुझे कल से बुखार है।"),
              p("How long have you had this?", "आपको यह कब से है?"),
              p("You should take some rest.", "आपको थोड़ा आराम करना चाहिए।"),
              p("Take this medicine twice a day.", "यह दवा दिन में दो बार लीजिए।"),
              p("Drink plenty of water.", "खूब पानी पीजिए।"),
              p("I hope you feel better soon.", "उम्मीद है आप जल्द ठीक हो जाएँगे।"),
            ],
          },
          {
            id: "3-2-3",
            title: { en: "Travel and Transport", hi: "यात्रा और परिवहन" },
            tip: {
              en: "At a station or stand, short questions work best: \"Which train goes to Delhi?\" \"What time does the bus leave?\"",
              hi: "स्टेशन या बस अड्डे पर छोटे सवाल सबसे अच्छे रहते हैं: \"Which train goes to Delhi?\" \"What time does the bus leave?\"",
            },
            phrases: [
              p("Which train goes to Delhi?", "कौन सी ट्रेन दिल्ली जाती है?"),
              p("I would like a ticket to Patna.", "मुझे पटना का एक टिकट चाहिए।"),
              p("What time does the bus leave?", "बस कितने बजे चलती है?"),
              p("The train is late today.", "आज ट्रेन देर से है।"),
              p("Is this seat taken?", "क्या यह सीट खाली है?"),
              p("Please keep your luggage with you.", "कृपया अपना सामान अपने पास रखिए।"),
              p("We reached the station on time.", "हम समय पर स्टेशन पहुँच गए।"),
              p("Have a safe journey!", "आपकी यात्रा सुरक्षित रहे!"),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 4,
    title: { en: "Fluent Speaker", hi: "धाराप्रवाह वक्ता" },
    subtitle: { en: "Stories, speeches, debates and interviews", hi: "कहानी, भाषण, बहस और इंटरव्यू" },
    units: [
      {
        id: "4-1",
        title: { en: "Speaking with Confidence", hi: "आत्मविश्वास से बोलना" },
        lessons: [
          {
            id: "4-1-1",
            title: { en: "Telling a Story", hi: "कहानी सुनाना" },
            tip: {
              en: "Link your story with time words: first, then, suddenly, after that, in the end. They keep the listener with you.",
              hi: "अपनी कहानी को समय वाले शब्दों से जोड़ें: first, then, suddenly, after that, in the end. इनसे सुनने वाला आपसे जुड़ा रहता है।",
            },
            phrases: [
              p("Once upon a time, there was a king.", "एक समय की बात है, एक राजा था।"),
              p("One day, something strange happened.", "एक दिन एक अजीब बात हुई।"),
              p("Suddenly, the lights went out.", "अचानक बत्ती चली गई।"),
              p("After that, everyone became quiet.", "उसके बाद सब चुप हो गए।"),
              p("In the end, they all became friends.", "अंत में वे सब दोस्त बन गए।"),
              p("The moral of the story is to be kind.", "कहानी की सीख है कि दयालु बनो।"),
              p("Let me tell you what happened.", "मैं आपको बताता हूँ क्या हुआ।"),
              p("Believe it or not, it was true.", "मानो या न मानो, यह सच था।"),
            ],
          },
          {
            id: "4-1-2",
            title: { en: "Giving a Short Speech", hi: "छोटा भाषण देना" },
            tip: {
              en: "A good speech has three parts: a start, a middle and an end. Say what you will talk about, talk about it, then sum it up.",
              hi: "अच्छे भाषण के तीन हिस्से होते हैं: शुरुआत, बीच और अंत। पहले बताइए कि क्या बोलेंगे, फिर बोलिए, फिर निचोड़ बताइए।",
            },
            phrases: [
              p("Good morning, everyone. Today I will talk about my school.", "सुप्रभात सबको। आज मैं अपने स्कूल के बारे में बात करूँगा।"),
              p("First of all, let me introduce myself.", "सबसे पहले मैं अपना परिचय देता हूँ।"),
              p("The main point is discipline.", "मुख्य बात अनुशासन है।"),
              p("For example, we reach school on time.", "उदाहरण के लिए, हम समय पर स्कूल पहुँचते हैं।"),
              p("To sum up, hard work always pays off.", "संक्षेप में, मेहनत हमेशा रंग लाती है।"),
              p("Thank you for listening so patiently.", "इतने धैर्य से सुनने के लिए धन्यवाद।"),
              p("Does anyone have a question?", "क्या किसी का कोई सवाल है?"),
              p("Let me explain this with an example.", "मैं इसे एक उदाहरण से समझाता हूँ।"),
            ],
          },
          {
            id: "4-1-3",
            title: { en: "Polite Debate", hi: "विनम्रता से बहस" },
            tip: {
              en: "In a debate, attack the idea, never the person. \"I see it differently\" and \"I respectfully disagree\" keep the talk friendly.",
              hi: "बहस में विचार का विरोध करें, व्यक्ति का नहीं। \"I see it differently\" और \"I respectfully disagree\" बातचीत को दोस्ताना रखते हैं।",
            },
            phrases: [
              p("You have a valid point, but I see it differently.", "आपकी बात सही है, पर मैं इसे अलग तरह से देखता हूँ।"),
              p("I respectfully disagree.", "मैं सम्मान के साथ असहमत हूँ।"),
              p("On the other hand, there is another view.", "दूसरी ओर, एक और नज़रिया भी है।"),
              p("Let me give you a reason.", "मैं आपको एक कारण बताता हूँ।"),
              p("That is true to some extent.", "कुछ हद तक यह सच है।"),
              p("I would like to add something.", "मैं कुछ जोड़ना चाहूँगा।"),
              p("Can we agree to disagree?", "क्या हम असहमत होने पर सहमत हो सकते हैं?"),
              p("Both sides have good arguments.", "दोनों पक्षों के पास अच्छे तर्क हैं।"),
            ],
          },
        ],
      },
      {
        id: "4-2",
        title: { en: "Interviews and Life Skills", hi: "इंटरव्यू और जीवन कौशल" },
        lessons: [
          {
            id: "4-2-1",
            title: { en: "Interview Basics", hi: "इंटरव्यू की बुनियादी बातें" },
            tip: {
              en: "Keep answers short and honest. Give one example for every strength you mention.",
              hi: "जवाब छोटे और सच्चे रखें। अपनी हर खूबी के लिए एक उदाहरण दें।",
            },
            phrases: [
              p("Tell me about yourself.", "मुझे अपने बारे में बताइए।"),
              p("My strength is hard work.", "मेरी ताकत मेहनत है।"),
              p("I am a quick learner.", "मैं जल्दी सीखता हूँ।"),
              p("I want to improve my communication skills.", "मैं अपने संवाद कौशल सुधारना चाहता हूँ।"),
              p("Why should we choose you?", "हम आपको क्यों चुनें?"),
              p("I am always ready to learn.", "मैं सीखने के लिए हमेशा तैयार रहता हूँ।"),
              p("I have good teamwork skills.", "मुझमें टीमवर्क के अच्छे गुण हैं।"),
              p("Thank you for this opportunity.", "इस अवसर के लिए धन्यवाद।"),
            ],
          },
          {
            id: "4-2-2",
            title: { en: "Idioms and Sayings", hi: "मुहावरे और कहावतें" },
            tip: {
              en: "Idioms do not mean what the words say. \"A piece of cake\" is not about cake: it means something is very easy.",
              hi: "मुहावरों का मतलब शब्दों से अलग होता है। \"A piece of cake\" केक की बात नहीं है, इसका मतलब है कि कोई काम बहुत आसान है।",
            },
            phrases: [
              p("Practice makes perfect.", "अभ्यास से इंसान परिपूर्ण बनता है।"),
              p("Better late than never.", "देर आए दुरुस्त आए।"),
              p("Actions speak louder than words.", "कर्म शब्दों से ज़्यादा बोलते हैं।"),
              p("It is a piece of cake.", "यह तो बहुत आसान है।"),
              p("Break a leg!", "शुभकामनाएँ! (प्रदर्शन से पहले)"),
              p("Once in a blue moon.", "कभी-कभार, बहुत कम।"),
              p("Hit the books.", "जमकर पढ़ाई करो।"),
              p("Do not give up.", "हार मत मानो।"),
            ],
          },
          {
            id: "4-2-3",
            title: { en: "Speaking with Confidence", hi: "आत्मविश्वास से बोलना" },
            tip: {
              en: "Confidence is built by practice, not by being perfect. Every mistake you make while speaking is a step forward.",
              hi: "आत्मविश्वास अभ्यास से बनता है, परफ़ेक्ट होने से नहीं। बोलते समय की हर गलती एक कदम आगे बढ़ना है।",
            },
            phrases: [
              p("Take a deep breath and speak slowly.", "गहरी साँस लें और धीरे बोलें।"),
              p("Look at the person you are talking to.", "जिससे बात कर रहे हैं उसकी ओर देखें।"),
              p("It is okay to make mistakes.", "गलतियाँ करना ठीक है।"),
              p("I will keep practising every day.", "मैं हर दिन अभ्यास करता रहूँगा।"),
              p("Speak clearly and politely.", "साफ़ और विनम्रता से बोलें।"),
              p("Listen carefully before you answer.", "जवाब देने से पहले ध्यान से सुनें।"),
              p("Confidence comes from practice.", "आत्मविश्वास अभ्यास से आता है।"),
              p("I can speak English confidently!", "मैं आत्मविश्वास से अंग्रेज़ी बोल सकता हूँ!"),
            ],
          },
        ],
      },
    ],
  },
];

export interface LessonRef {
  lesson: Lesson;
  level: Level;
  unit: Unit;
  /** Position in the whole course, starting at 0. Lessons unlock in this order. */
  order: number;
}

/** Every lesson in the order a student takes them. */
export const LESSONS: LessonRef[] = COURSE.flatMap((level) =>
  level.units.flatMap((unit) => unit.lessons.map((lesson) => ({ lesson, level, unit, order: 0 }))),
).map((ref, index) => ({ ...ref, order: index }));

const byId = new Map(LESSONS.map((ref) => [ref.lesson.id, ref]));

export const getLessonRef = (id: string): LessonRef | undefined => byId.get(id);

/** The lesson that comes straight after `id`, if any. */
export const nextLessonId = (id: string): string | null => {
  const ref = byId.get(id);
  return ref ? (LESSONS[ref.order + 1]?.lesson.id ?? null) : null;
};
