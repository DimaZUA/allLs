﻿var us = {13:'Перерахунок',1:'Внесок на утримання будинку',7:'Вивіз побутового сміття',10:'Цільові внески на ремонт',12:'Компенсація',15:'Погріб',16:'Прибудова'};
var b = {200062:'Приватбанк (АВТО)'};
var nach={9890010:{2024:{10:{13:1285.5},11:{7:20,1:301.5},12:{1:301.5,7:20}}},9890020:{2024:{10:{13:133},11:{1:150,7:10},12:{1:150,7:10}}},9890030:{2024:{10:{13:-582},11:{1:217.5,7:10},12:{1:217.5,7:10}}},9890040:{2024:{10:{13:952.5},11:{7:10,1:307.5},12:{1:307.5,7:10}}},9890050:{2024:{10:{13:655},11:{1:154,7:10},12:{7:10,1:154}}},9890060:{2024:{10:{13:526},11:{7:10,1:222},12:{7:10,1:222}}},9890070:{2024:{10:{13:339},11:{7:20,1:309},12:{7:20,1:309}}},9890080:{2024:{10:{13:181},11:{7:10,1:160.5},12:{7:10,1:160.5}}},9890090:{2024:{10:{13:-423},11:{7:20,1:216.5},12:{7:20,1:216.5}}},9890100:{2024:{10:{13:1955},11:{1:307.5,7:10},12:{1:307.5,7:10}}},9890110:{2024:{10:{13:165},11:{7:30,1:155},12:{1:155,7:30}}},9890120:{2024:{10:{13:200},11:{1:208,7:10},12:{1:208,7:10}}},9890130:{2024:{10:{13:300},11:{7:30,1:308},12:{1:308,7:30}}},9890140:{2024:{10:{13:0},11:{1:151.85,7:10},12:{1:151.85,7:10}}},9890150:{2024:{10:{13:36.5},11:{1:222.5,7:10},12:{7:10,1:222.5}}},9890160:{2024:{10:{13:414},11:{7:30,1:229.5},12:{7:30,1:229.5}}},9890170:{2024:{10:{13:883.5},11:{1:210.5,7:10},12:{7:10,1:210.5}}},9890180:{2024:{10:{13:7646},11:{7:10,1:215},12:{1:215,7:10}}},9890190:{2024:{10:{13:850},11:{1:240,7:10},12:{1:240,7:10}}},9890200:{2024:{10:{13:622},11:{7:20,1:221},12:{7:20,1:221}}},9890210:{2024:{10:{13:-163},11:{1:221,7:20},12:{1:221,7:20}}},9890220:{2024:{10:{13:10302.5},11:{7:20,1:235.5},12:{1:235.5,7:20}}},9890230:{2024:{10:{13:151},11:{1:223,7:10},12:{1:223,7:10}}},9890240:{2024:{10:{13:0},11:{7:30,1:222.5},12:{7:30,1:222.5}}},9890250:{2024:{10:{13:84.5},11:{7:10,1:240},12:{7:10,1:240}}},9890260:{2024:{10:{13:64.4},11:{7:10,1:223},12:{7:10,1:223}}},9890270:{2024:{10:{13:210},11:{7:30,1:227.5},12:{7:30,1:227.5}}},9890280:{2024:{10:{13:-738},11:{1:238.05,7:10},12:{1:238.05,7:10}}},9890290:{2024:{10:{13:3132},11:{7:10,1:223},12:{1:223,7:10}}},9890300:{2024:{10:{13:8346},11:{1:221,7:10},12:{7:10,1:221}}},9890310:{2024:{10:{13:-880.2},11:{1:259.5,7:10},12:{7:10,1:259.5}}},9890320:{2024:{10:{13:484},11:{1:217,7:20},12:{1:217,7:20}}},9890330:{2024:{10:{13:1},11:{1:234,7:10},12:{1:234,7:10}}},9890340:{2024:{10:{13:-550},11:{7:10,1:219.5},12:{7:10,1:219.5}}},9890350:{2024:{10:{13:-473},11:{1:221.5,7:10},12:{1:221.5,7:10}}},9890360:{2024:{10:{13:535.5},11:{1:236.5,7:10},12:{1:236.5,7:10}}},9890370:{2024:{10:{13:228},11:{7:10,1:222.5},12:{1:222.5,7:10}}},9890380:{2024:{10:{13:455},11:{7:20,1:220},12:{7:20,1:220}}},9890390:{2024:{10:{13:0},11:{1:238,7:10},12:{1:238,7:10}}},9890400:{2024:{10:{13:1472},11:{1:222.2,7:20},12:{7:20,1:222.2}}},9890410:{2024:{10:{13:-554},11:{1:220.5,7:30},12:{1:220.5,7:30}}},9890420:{2024:{10:{13:306},11:{7:10,1:240},12:{1:240,7:10}}},9890430:{2024:{10:{13:-0.5},11:{1:221.5,7:10},12:{1:221.5,7:10}}},9890440:{2024:{10:{13:0},11:{7:10,1:220},12:{7:10,1:220}}},9890450:{2024:{10:{13:602.6},11:{1:241.5,7:10},12:{7:10,1:241.5}}},9890460:{2024:{10:{13:543},11:{7:10,1:221},12:{1:221,7:10}}},9890470:{2024:{10:{13:429},11:{1:150.5,7:10},12:{1:150.5,7:10}}},9890480:{2024:{10:{13:971},11:{1:307,7:10},12:{7:10,1:307}}},9890490:{2024:{10:{13:-496},11:{1:222.5,7:20},12:{1:222.5,7:20}}},9890500:{2024:{10:{13:306},11:{7:10,1:153},12:{7:10,1:153}}},9890510:{2024:{10:{13:8831},11:{7:30,1:307.2},12:{7:30,1:307.2}}},9890520:{2024:{10:{13:7612},11:{1:220,7:10},12:{1:220,7:10}}},9890530:{2024:{10:{13:101.5},11:{1:152.5,7:10},12:{1:152.5,7:10}}},9890540:{2024:{10:{13:-699},11:{7:10,1:302.5},12:{1:302.5,7:10}}},9890550:{2024:{10:{13:1140},11:{7:10,1:220},12:{7:10,1:220}}},9890560:{2024:{10:{13:-644},11:{1:154,7:10},12:{1:154,7:10}}},9890570:{2024:{10:{13:305},11:{7:20,1:303.5},12:{7:20,1:303.5}}},9890580:{2024:{10:{13:-684.5},11:{1:220.5,7:10},12:{1:220.5,7:10}}},9890590:{2024:{10:{13:-143.5},11:{7:10,1:152.5},12:{7:10,1:152.5}}},9890600:{2024:{10:{13:0},11:{1:303.5,7:10},12:{1:303.5,7:10}}}};
var ls={9890010:{kv:'1',ls:'1',fio:'Книженко Ольга Василівна',pl:60.3,pers:2},9890020:{kv:'2',ls:'2',fio:'Слинько Сергій Володимирович',pl:30,pers:1},9890030:{kv:'3',ls:'3',fio:'Піщуліна Галина Семенівна',pl:43.5,pers:1},9890040:{kv:'4',ls:'4',fio:'Маклакова Тетяна Сергіївна',pl:61.5,pers:1},9890050:{kv:'5',ls:'5',fio:'Коновалова Ніна Иосифовна',pl:30.8,pers:1},9890060:{kv:'6',ls:'6',fio:'Чанцев Микола Степанович',pl:44.4,pers:1},9890070:{kv:'7',ls:'7',fio:'Токарь Валентина Павлівна',pl:61.8,pers:2},9890080:{kv:'8',ls:'8',fio:'Спиридонов Андрій Виталійович',pl:32.1,pers:1},9890090:{kv:'9',ls:'9',fio:'Заболотна Юлія Вікторівна',pl:43.3,pers:2},9890100:{kv:'10',ls:'10',fio:'Челомбітько Ганно Сергіївна',pl:61.5,pers:1},9890110:{kv:'11',ls:'11',fio:'Пасинок Вікторія Василівна',pl:31,pers:3},9890120:{kv:'12',ls:'12',fio:'Куріцина Лідія Максимівна',pl:41.6,pers:1},9890130:{kv:'13',ls:'13',fio:'Петренко Валентині Іванівна',pl:61.6,pers:3},9890140:{kv:'14',ls:'14',fio:'Моргуненко Жаннета Стефанівна',pl:30.37,pers:1},9890150:{kv:'15',ls:'15',fio:'Гольченко Катерина Олександрівна',pl:44.5,pers:1},9890160:{kv:'16',ls:'16',fio:'Усічко Юрій Вікторович',pl:45.9,pers:3},9890170:{kv:'17',ls:'17',fio:'Скіпенко Олександр Борисович',pl:42.1,pers:1},9890180:{kv:'18',ls:'18',fio:'Борохова Наталія Олександрівна',pl:43,pers:1},9890190:{kv:'19',ls:'19',fio:'Ришкіна Яна Валентинівна',pl:48,pers:1},9890200:{kv:'20',ls:'20',fio:'Брунец Владислав Володимирович',pl:44.2,pers:2},9890210:{kv:'21',ls:'21',fio:'Лобанова Ольга Георгіївна',pl:44.2,pers:2},9890220:{kv:'22',ls:'22',fio:'Гусев Юрій Миколайович',pl:47.1,pers:2},9890230:{kv:'23',ls:'23',fio:'Рижкова Раїса Яківна',pl:44.6,pers:1},9890240:{kv:'24',ls:'24',fio:'Бойко Олександр Володимирович',pl:44.5,pers:3},9890250:{kv:'25',ls:'25',fio:'Сєнна Ірина Вікторівна',pl:48,pers:1},9890260:{kv:'26',ls:'26',fio:'Грищенко Вячеслав Олександрович',pl:44.6,pers:1},9890270:{kv:'27',ls:'27',fio:'Данець Анатолій Васильович',pl:45.5,pers:3},9890280:{kv:'28',ls:'28',fio:'Рич Лідія Ільінічна',pl:47.61,pers:1},9890290:{kv:'29',ls:'29',fio:'Сурган Ірина Володимирівна',pl:44.6,pers:1},9890300:{kv:'30',ls:'30',fio:'Татарінцева Олена Анатоліївна',pl:44.2,pers:1},9890310:{kv:'31',ls:'31',fio:'Перелигіна Тамара Дмитрівна',pl:51.9,pers:1},9890320:{kv:'32',ls:'32',fio:'Серьожкін Олександр Олексійович',pl:43.4,pers:2},9890330:{kv:'33',ls:'33',fio:'Белевцев Вадим Вікторович',pl:46.8,pers:1},9890340:{kv:'34',ls:'34',fio:'Рижих Вікторія Олександрівна',pl:43.9,pers:1},9890350:{kv:'35',ls:'35',fio:'Заболотник Тетяна Юріївна',pl:44.3,pers:1},9890360:{kv:'36',ls:'36',fio:'Черкашина Валерія Анатоліївна',pl:47.3,pers:1},9890370:{kv:'37',ls:'37',fio:'Кривобок Олександра Димидівна',pl:44.5,pers:1},9890380:{kv:'38',ls:'38',fio:'Ршов Одександр Віталійович',pl:44,pers:2},9890390:{kv:'39',ls:'39',fio:'Шумейко Олександр Миколайович',pl:47.6,pers:1},9890400:{kv:'40',ls:'40',fio:'Кравченко Лідія Карповна',pl:44.44,pers:2},9890410:{kv:'41',ls:'41',fio:'Лабунський Віктор Єгорович',pl:44.1,pers:3},9890420:{kv:'42',ls:'42',fio:'Жартовська Емма Андріївна',pl:48,pers:1},9890430:{kv:'43',ls:'43',fio:'Клигіна Ірина Володимирівна',pl:44.3,pers:1},9890440:{kv:'44',ls:'44',fio:'Зекун Ірина Володимирівна',pl:44,pers:1},9890450:{kv:'45',ls:'45',fio:'Романко Леонід Анатолійович',pl:48.3,pers:1},9890460:{kv:'46',ls:'46',fio:'Чуйко Оксана Анатоліївна',pl:44.2,pers:1},9890470:{kv:'47',ls:'47',fio:'Фаттякова Рахілія Фатяковна',pl:30.1,pers:1},9890480:{kv:'48',ls:'48',fio:'Богданова Галина Іванівна',pl:61.4,pers:1},9890490:{kv:'49',ls:'49',fio:'Бондарь Лариса Григорівна',pl:44.5,pers:2},9890500:{kv:'50',ls:'50',fio:'Мерзлікіна Ірина Василівна',pl:30.6,pers:1},9890510:{kv:'51',ls:'51',fio:'Земляна Інна Василівна',pl:61.44,pers:3},9890520:{kv:'52',ls:'52',fio:'Веліконова Валентина Василівна',pl:44,pers:1},9890530:{kv:'53',ls:'53',fio:'Кузьменко Лариса Борисівна',pl:30.5,pers:1},9890540:{kv:'54',ls:'54',fio:'Губа Наталія Миколаївна',pl:60.5,pers:1},9890550:{kv:'55',ls:'55',fio:'Стасюк Марія Іванівна',pl:44,pers:1},9890560:{kv:'56',ls:'56',fio:'Ніколенко Руслан Володимирович',pl:30.8,pers:1},9890570:{kv:'57',ls:'57',fio:'Мартиренко Анатолій Анатолійович',pl:60.7,pers:2},9890580:{kv:'58',ls:'58',fio:'Боровий Руслан Володимирович',pl:44.1,pers:1},9890590:{kv:'59',ls:'59',fio:'Савицька Лариса Володимирівна',pl:30.5,pers:1},9890600:{kv:'60',ls:'60',fio:'Раснянська Ольга Сергіївна',pl:60.7,pers:1}};
var oplat={9890060:{2022:{2:[{sum:500,date:'01.02.2022',yur:'200062'}]}}}
var org='ЖК "Венера"'
var adr='пр.Тракторобудівників, 89А'
var dt='07.12.2024 18:29:00'