// Show schedule. Ring numbers are unique across the whole show.
(function(){
const U="Utility",H="Hound",G="Gundog",T="Toy",WK="Working",TR="Terrier";
const C=(name,...e)=>({name,entries:e.map(x=>{const m=x.match(/^(\d+)\s+(.+)$/);return {no:m[1],name:m[2]}})});
window.SHOW_SESSIONS=[{"id": "saturday", "file": "saturday.html", "label": "Sat 31 Oct", "title": "Saturday · Utility & Hound"}, {"id": "sunday-morning", "file": "sunday-morning.html", "label": "Sun morning", "title": "Sunday morning · Gundog & Toy"}, {"id": "sunday-evening", "file": "sunday-evening.html", "label": "Sun evening", "title": "Sunday evening · Working & Terrier"}];
window.SHOW_DATA={
"saturday":[
  {name:"Junior Handler",special:true,classes:[C("Junior Handler","11 KYLIE CILIA","54 FRANCESCA ATTARD")]},
  {name:"Boston Terrier",group:U,classes:[C("Junior Bitch","36 LARISSA DI NOBILE MORGANA")]},
  {name:"Bulldog",group:U,classes:[C("Puppy Bitch","17 LILLIBETH THE QUEEN BRIGHT DIAMOND"),C("Open Bitch","16 Ch. KAYLA BRIGHT DIAMOND")]},
  {name:"French Bulldog",group:U,classes:[C("Junior Bitch","106 KIRA FROM DRACULA'S BLOODLINE"),C("Puppy Dog","127 HUGO BOSS VILLA LENSSTYLE")]},
  {name:"Japanese Shiba Inu",group:U,classes:[C("Puppy Bitch","21 RICVAS MELEK"),C("Junior Bitch","18 NIK MAJESTIK MIRAI"),C("Open Dog","19 AKAI HANA B'SEIDI MERC","71 Ch. DAMYOSHI BUSHI")]},
  {name:"Poodle (Miniature)",group:U,classes:[C("Puppy Dog","117 EVIDDENTE OVER THE EDGE")]},
  {name:"Poodle (Standard)",group:U,classes:[C("Puppy Bitch","83 SHUVALOFF OPPOSITES ATTRACT"),C("Junior Bitch","82 EDIVETTE MI CORAZON NIEVA"),C("Open Dog","81 EDIVETTE COMO MIRARTE")]},
  {name:"Poodle (Toy)",group:U,classes:[C("Puppy Bitch","112 MALENKAYA LEDI"),C("Open Dog","95 M AND C SIGNATURE ALLURE")]},
  {name:"Shih Tzu",group:U,classes:[C("Open Bitch","85 DEMITRA INCANTO D'AMORE"),C("Veteran Bitch","84 Ch. PERLA SOLO PER I TUOI OCCHI")]},
  {name:"Basenji",group:H,classes:[C("Puppy Dog","52 M WAMI'S SINNERS PRAYER"),C("Open Dog","124 Ch. MANICARO DIESEL DAF")]},
  {name:"Dachshund (Miniature Long Haired)",group:H,classes:[C("Puppy Bitch","108 MARILYN MONROE DI CAMPO LUNGO","110 GRACE KELLY DI CAMPO LUNGO"),C("Open Bitch","20 Ch. ESME HISROYALMAJESTY"),C("Open Dog","22 Ch. GATEAU ROUGE DELLA ROCO DEI PAPI")]},
  {name:"Dachshund (Miniature Smooth Haired)",group:H,classes:[C("Junior Bitch","109 DIFFERENT STRINGS DARLA")]},
  {name:"Dachshund (Miniature Wire Haired)",group:H,classes:[C("Open Dog","67 MAGIK RAINBOW FORD TOM")]},
  {name:"Dachshund (Smooth Haired)",group:H,classes:[C("Puppy Dog","111 WAKYWILKS HERCULES")]},
  {name:"Irish Wolfhound",group:H,classes:[C("Junior Bitch","23 HAZEL DELLA BASSA PAVESE"),C("Junior Dog","25 FURIA FARGO MITIS ARAFA"),C("Open Dog","24 TOBERCORRAN THUNDER")]},
  {name:"Pharaoh Hound",group:H,classes:[C("Puppy Dog","26 RAMSEY")]},
  {name:"Saluki",group:H,classes:[C("Veteran Dog","102 Ch. GABRA CK ALEXANDER HELIOS")]},
  {name:"Whippet",group:H,classes:[C("Puppy Bitch","34 NOTABLE DHALIA","77 DAKOTA ALEXEM DREAM"),C("Veteran Bitch","119 CHRISOLI DA YA THINK I'M SEXY"),C("Junior Dog","35 NOTABLE CHEDDAR"),C("Open Dog","118 Ch. SUNTACH HE IS")]},
  {name:"Any Variety Locally Bred Utility",special:true,firstOnly:true,classes:[C("Open Bitch","86 DEMITRA INCANTO D'AMORE (Shih Tzu)")]}
],
"sunday-morning":[
  {name:"English Setter",group:G,classes:[C("Open Dog","105 Sh.Ch. DINGLI GEM ELEGY FOR THE ARCTIC")]},
  {name:"Pointer",group:G,classes:[C("Open Bitch","29 Sh.Ch. BERSEYDALE FULL HOUSE"),C("Junior Dog","30 CHESTERHOPE LANCELOT")]},
  {name:"Retriever (Flatcoated)",group:G,classes:[C("Open Dog","51 Sh.Ch. BERSIFJOR MODO MIRACOLOSO")]},
  {name:"Retriever (Golden)",group:G,classes:[
    C("Puppy Bitch","38 RASHKA.B OF DREAMS KENNEL","65 AMAZING GRACE DE LAR DE CASANOVA","129 UNICA SAKURA DEI VASILEVA"),
    C("Junior Bitch","59 GOLDEN AURORA DONA SOLECITA PEREGRINA"),
    C("Open Bitch","61 Sh.Ch. GOLDEN AURORA A STAR IS BORN","91 NAVILIS HOLD ME CLOSE","99 SHIVA'S GOLDEN IL MONDO NUOVO"),
    C("Puppy Dog","60 GOLDEN AURORA HUGO INVICTUS TRINITATIS"),
    C("Open Dog","31 Sh.Ch. BLUE LIVES PRINCE BENJI","58 Sh.Ch. GOLDEN AURORA LOVESTORY","62 Sh.Ch. OLVINGLAY TRIQUETRA","98 Sh.Ch. SHIVA'S GOLDEN DON CANDELORO")]},
  {name:"Retriever (Labrador)",group:G,classes:[C("Open Bitch","56 TOPSKEN LILLY"),C("Junior Dog","33 CRÈME BRULEE FRIEND DEI DUE MARI"),C("Veteran Dog","88 Sh.Ch. NEVILL OPEN HEART")]},
  {name:"Spaniel (Cocker)",group:G,classes:[C("Open Dog","49 Sh.Ch. CROSSTREE THE ONE AND ONLY"),C("Veteran Dog","50 Sh.Ch. GLENTREE HERITAGE")]},
  {name:"Spaniel (English Springer)",group:G,classes:[C("Open Dog","55 TAL-PITAZZ DUJAN")]},
  {name:"Spanish Water Dog",group:G,classes:[C("Puppy Bitch","128 FAIRRAY COTTON CANDY OF ZORRAZO"),C("Open Bitch","9 Sh.Ch. DINGLIGEM BETTY DAVIES EYES","72 DINGLIGEM MINGH MINGH","113 Sh.Ch. DINGLIGEM LOVABLE LUCY"),C("Puppy Dog","114 FAIRRAY BELLO CARAMELLO DI ZORRAZO")]},
  {name:"Childrens Class",special:true,classes:[C("Childrens Class","12 NICOLE CILIA")]},
  {name:"Cavalier King Charles Spaniel",group:T,classes:[C("Open Bitch","107 CASSLONG LUNA DOLCE"),C("Open Dog","126 TAURUNUM ANGEL'S TURN OFF LIGHT")]},
  {name:"Chihuahua (Long Coat)",group:T,classes:[C("Puppy Bitch","87 GOLDEN PAWS LADY IN RED"),C("Open Dog","13 CHICOSTARS A LUCKY WHITE CANDY STAR")]},
  {name:"Chihuahua (Smooth Coat)",group:T,classes:[C("Puppy Bitch","14 LOGERFOLD KARTANA SWORD DANCE"),C("Puppy Dog","15 GOLDEN PAWS FOLLOW THE WHITE LINE","37 WHY NOT OF DREAMS KENNEL")]},
  {name:"Lowchen (Little Lion Dog)",group:T,classes:[C("Junior Dog","28 EDENISLE CZAR OF CHARM AND CHAOS")]},
  {name:"Maltese",group:T,classes:[C("Open Dog","90 SILKWHITE DREAMS GUNS BLAZING")]},
  {name:"Pekingese",group:T,classes:[C("Puppy Dog","8 PEQUEST PROSECCO")]},
  {name:"Pomeranian",group:T,classes:[C("Junior Bitch","40 RKRK PRINCESS BJANA"),C("Puppy Dog","75 SULTANA-VALMAR APOLLO","76 SULTANA-VALMAR EROS"),C("Open Dog","41 BORDPOL HUGO THE BOSS","42 THAI SILK MAXIMUM POWER","66 Ch. THAI SILK MR SUGAR DONUT","73 SULTANA-VALMAR STAR ADONIS","74 Ch. DAN-STAR-KOM FLAY DE CRISTAL")]},
  {name:"Pug",group:T,classes:[C("Puppy Bitch","101 ORNELLA MUTI FAN-FAN FAVORI"),C("Puppy Dog","78 CONNOR DE IALENMAR-ARGENTINA"),C("Open Dog","100 Ch. GABRA CK UNSTOPPABLE LOUIE")]},
  {name:"Any Variety Locally Bred Gundog/Toy",special:true,firstOnly:true,classes:[C("Any Variety Locally Bred","32 Sh.Ch. BLUE LIVES PRINCE BENJI (Retriever (Golden))","43 RKRK PRINCESS BJANA (Pomeranian)","96 SULTANA-VALMAR STAR ADONIS (Pomeranian)")]}
],
"sunday-evening":[
  {name:"Border Collie",group:WK,classes:[C("Puppy Bitch","63 SIMARO QUEEN OF DIAMONDS"),C("Open Bitch","39 JUPAVIA NOBODY CAN STOP TIME"),C("Open Dog","64 SILVERCLIFFS A TRIBUTE TO OLD HEMP")]},
  {name:"Boxer",group:WK,classes:[C("Puppy Bitch","3 BRYNHAFOD SHACARRI ON FIRE","5 HIGHCREST MYSTIQUE MAKING WAVES","7 CILEMM MYSTERIOUS GIRL"),C("Open Bitch","1 Ch. CILEMM WALK THE TALK","4 MAXICE ANA LUNA","97 Ch. BRYNHAFOD SWEET PEA"),C("Junior Dog","103 SASHBOB NEVER SA NEVER FROM BERWYNFA"),C("Open Dog","2 Ch. BRYNHAFOD JOHNNY BRAVO","6 LEVISBROOKS COSMIC VOYAGER","104 Ch. LIMUBOX WICKED FANTASY")]},
  {name:"Bullmastiff",group:WK,classes:[C("Junior Dog","121 FAST AND FURIOUS IS TAMSOS")]},
  {name:"Canadian Eskimo Dog",group:WK,classes:[C("Junior Bitch","27 CALIDA QIMMIQ KYASSNOWFLAKE")]},
  {name:"Dobermann",group:WK,classes:[C("Puppy Bitch","10 GHOST OF THE DARK CHLOE")]},
  {name:"German Shepherd Dog",group:WK,classes:[C("Puppy Bitch","116 ARYA VAN CONTRA TEAM"),C("Open Bitch","125 BLAIR VOM RADHIUS"),C("Puppy Dog","123 AXEL KAISER VAN CONTRA TEAM"),C("Open Dog","68 Ch. CARLY DI POGGIO DEL SOLE","115 URAL VAN CONTRA")]},
  {name:"Rottweiler",group:WK,classes:[C("Puppy Bitch","94 XANDY VOM HAUSE NIVEKSUE"),C("Open Bitch","92 Ch. HOUSE OF TIROVA TINA"),C("Junior Dog","93 LAZZARUS SUNY DAYS"),C("Open Dog","53 It.Aus.Ch. ELAN VON DER BLEICHSTRASSE","57 MAXIMUS VOM HAUSE FURIMER")]},
  {name:"Siberian Husky",group:WK,classes:[C("Puppy Bitch","69 BANELORD THE FIRE STARTER"),C("Open Bitch","44 BANELORD BLASTER BOMB","45 SIERRA IMPERIO IMANBEK"),C("Veteran Bitch","46 Ch. BANELORD RAG DOLL","47 Ch. BANELORD LAVA FLOWING CREST"),C("Veteran Dog","70 Ch. AYUKA'S ANGEL OF DISTRUCTION")]},
  {name:"Welsh Corgi (Pembroke)",group:WK,classes:[C("Junior Bitch","80 BORN TO BE YOUR FOOLS GOLD"),C("Open Dog","79 ART-CITY PACIFICUS OCEANUS")]},
  {name:"Bull Terrier",group:TR,classes:[C("Open Bitch","120 UNIQUE PASSION BIG GUN LADY")]},
  {name:"Fox Terrier (Wire)",group:TR,classes:[C("Open Dog","89 TRAVELLA SET TO SOAR")]},
  {name:"Staffordshire Bull Terrier",group:TR,classes:[C("Puppy Dog","122 VANGERBULL BARRY")]},
  {name:"Any Variety Locally Bred Working",special:true,firstOnly:true,classes:[C("Any Variety Locally Bred","48 Ch. BANELORD LAVA FLOWING CREST (Siberian Husky)")]}
]
};
})();
