// straights
const straights = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
];
// splits
const splits = [
    [1, 4], // 1
    [2, 5], // 2
    [3, 6], // 3
    [7, 10], // 4
    [8, 11], // 5
    [9, 12], // 6
    [13, 16], // 7
    [14, 17], // 8
    [15, 18], // 9
    [19, 22], // 10
    [20, 23], // 11
    [21, 24], // 12
    [25, 28], // 13
    [26, 29], // 14
    [27, 30], // 15
    [31, 34], // 16
    [32, 35], // 17
    [33, 36], // 18
];
// streets
const streets = [
    [1, 2, 3], // 1
    [4, 5, 6], // 2
    [7, 8, 9], // 3
    [10, 11, 12], // 4
    [13, 14, 15], // 5
    [16, 17, 18], // 6
    [19, 20, 21], // 7
    [22, 23, 24], // 8
    [25, 26, 27], // 9
    [28, 29, 30], // 10
    [31, 32, 33], // 11
    [34, 35, 36], // 12
];
// double streets
const DS = [
    [1, 2, 3, 4, 5, 6], // 1
    [7, 8, 9, 10, 11, 12], // 2
    [13, 14, 15, 16, 17, 18], // 3
    [19, 20, 21, 22, 23, 24], // 4
    [25, 26, 27, 28, 29, 30], // 5
    [31, 32, 33, 34, 35, 36], // 6
];

const straightsCopy = [...straights];
const splitsCopy = [...splits];
const streetsCopy = [...streets];
const dsCopy = [...DS];

const enteredNumbers = [];

// DERIVED

let derivedStraightNumbers = [];
let derivedSplitIndexes = [];
let derivedStreetIndexes = [];
let derivedDSindexes = [];

let toBetStraight = [];
let toBetSplits = [];
let toBetStreets = [];
let toBetDS = [];

// MAIN

let fetchedStraightMain = [];
let fetchedSplitsIndexes = [];
let fetchedStreetsIndexes = [];
let fetchedDSIndexes = [];

let toBetStraightMAIN = [];
let toBetSplitsMAIN = [];
let toBetStreetsMAIN = [];
let toBetDSMAIN = [];

// DERIVED
const sortStraightNumbers = (number) => {
    const indexOfStraightNumber = straights.indexOf(number); // 14
    const derivedNumber = indexOfStraightNumber + 1;
    if (derivedStraightNumbers.includes(derivedNumber)) {
        derivedStraightNumbers = [];
    }
    derivedStraightNumbers.push(derivedNumber);
    straights.splice(indexOfStraightNumber, 1);
    straights.splice(0, 0, number);
};
const sortSplits = (number) => {
    const splitIndex = splits.reduce(
        (acc, item, i) => (item.includes(number) ? (acc = i + 1) : acc, acc),
        0
    );
    if (derivedSplitIndexes.includes(splitIndex)) {
        derivedSplitIndexes = [];
    }
    const splitItem = splits[splitIndex - 1];
    derivedSplitIndexes.push(splitIndex);
    splits.splice(splitIndex - 1, 1); // delete out first
    splits.splice(0, 0, splitItem); // then replace at start
};
const sortStreets = (number) => {
    const streetIndex = streets.reduce(
        (acc, item, i) => (item.includes(number) ? (acc = i + 1) : acc, acc),
        0
    );
    if (derivedStreetIndexes.includes(streetIndex)) {
        derivedStreetIndexes = [];
    }
    const streetItem = streets[streetIndex - 1];
    derivedStreetIndexes.push(streetIndex);
    streets.splice(streetIndex - 1, 1); // delete out first
    streets.splice(0, 0, streetItem); // then replace at start
};
const sortDoubleStreets = (number) => {
    const streetIndex = DS.reduce(
        (acc, item, i) => (item.includes(number) ? (acc = i + 1) : acc, acc),
        0
    );
    if (derivedDSindexes.includes(streetIndex)) {
        derivedDSindexes = [];
    }
    const streetItem = DS[streetIndex - 1];
    derivedDSindexes.push(streetIndex);
    DS.splice(streetIndex - 1, 1); // delete out first
    DS.splice(0, 0, streetItem); // then replace at start
};
// MAIN
const sortStraightNumbersMAIN = (number) => {
    const indexOfStraightNumber = straightsCopy.indexOf(number); // 12
    const fetchedNum = indexOfStraightNumber + 1;
    if (fetchedStraightMain.includes(fetchedNum)) {
        fetchedStraightMain = [];
    }
    fetchedStraightMain.push(fetchedNum);
};
const sortSplitsMAIN = (number) => {
    const index = splitsCopy.reduce(
        (acc, item, i) => (item.includes(number) ? (acc = i + 1) : acc, acc),
        0
    );
    if (fetchedSplitsIndexes.includes(index)) {
        fetchedSplitsIndexes = [];
    }
    fetchedSplitsIndexes.push(index);
};
const sortStreetsMAIN = (number) => {
    const index = streetsCopy.reduce(
        (acc, item, i) => (item.includes(number) ? (acc = i + 1) : acc, acc),
        0
    );
    if (fetchedStreetsIndexes.includes(index)) {
        fetchedStreetsIndexes = [];
    }
    fetchedStreetsIndexes.push(index);
};
const sortDoubleStreetsMAIN = (number) => {
    const index = dsCopy.reduce(
        (acc, item, i) => (item.includes(number) ? (acc = i + 1) : acc, acc),
        0
    );
    if (fetchedDSIndexes.includes(index)) {
        fetchedDSIndexes = [];
    }
    fetchedDSIndexes.push(index);
};

const enterNumber = (number) => {
    sortStraightNumbers(number);
    sortSplits(number);
    sortStreets(number);
    sortDoubleStreets(number);
    // main
    sortStraightNumbersMAIN(number);
    sortSplitsMAIN(number);
    sortStreetsMAIN(number);
    sortDoubleStreetsMAIN(number);
    enteredNumbers.push(number);
};

// ENTER NUMBER SEQUENCE BELOW >>>>>>>>>>
const numberSequence = [
    22, 17, 12, 19, 23,
    // , 34, 32, 30, 1, 4, 26
];
numberSequence.map((a) => enterNumber(a));
// ENTER NUMBER SEQUENCE ABOVE >>>>>>>>>>

const calculateStraights =
    derivedStraightNumbers.length > 18
        ? derivedStraightNumbers
              .slice(derivedStraightNumbers.length - 18)
              .map((a) => toBetStraight.push(straights[a - 1]))
        : derivedStraightNumbers.map((a) =>
              toBetStraight.push(straights[a - 1])
          );

const calculateBetSplits =
    derivedSplitIndexes.length > 9
        ? derivedSplitIndexes.slice(derivedSplitIndexes.length - 9).map((a) => {
              toBetSplits = toBetSplits.concat(splits[a - 1]);
              return a;
          })
        : derivedSplitIndexes.map((a) => {
              // '18'
              toBetSplits = toBetSplits.concat(splits[a - 1]);
              return a;
          });
const calculateBetStreets =
    derivedStreetIndexes.length > 6
        ? derivedStreetIndexes
              .slice(derivedStreetIndexes.length - 6)
              .map((a) => {
                  toBetStreets = toBetStreets.concat(streets[a - 1]);
                  return a;
              })
        : derivedStreetIndexes.map((a) => {
              toBetStreets = toBetStreets.concat(streets[a - 1]);
              return a;
          });
const calculateBetDS =
    derivedDSindexes.length > 3
        ? derivedDSindexes.slice(derivedDSindexes.length - 3).map((a) => {
              toBetDS = toBetDS.concat(DS[a - 1]);
              return a;
          })
        : derivedDSindexes.map((a) => {
              toBetDS = toBetDS.concat(DS[a - 1]);
              return a;
          });

// main

const calculateStraightsMain =
    fetchedStraightMain.length > 18
        ? fetchedStraightMain
              .slice(fetchedStraightMain.length - 18)
              .map((a) => toBetStraightMAIN.push(straightsCopy[a - 1]))
        : fetchedStraightMain.map((a) =>
              toBetStraightMAIN.push(straightsCopy[a - 1])
          );

const calculateBetSplitsMain =
    fetchedSplitsIndexes.length > 9
        ? fetchedSplitsIndexes
              .slice(fetchedSplitsIndexes.length - 9)
              .map((a) => {
                  toBetSplitsMAIN = toBetSplitsMAIN.concat(splitsCopy[a - 1]);
                  return a;
              })
        : fetchedSplitsIndexes.map((a) => {
              toBetSplitsMAIN = toBetSplitsMAIN.concat(splitsCopy[a - 1]);
              return a;
          });
const calculateBetStreetsMain =
    fetchedStreetsIndexes.length > 6
        ? fetchedStreetsIndexes
              .slice(fetchedStreetsIndexes.length - 6)
              .map((a) => {
                  toBetStreetsMAIN = toBetStreetsMAIN.concat(
                      streetsCopy[a - 1]
                  );
                  return a;
              })
        : fetchedStreetsIndexes.map((a) => {
              toBetStreetsMAIN = toBetStreetsMAIN.concat(streetsCopy[a - 1]);
              return a;
          });
const calculateBetDSMain =
    fetchedDSIndexes.length > 3
        ? fetchedDSIndexes.slice(fetchedDSIndexes.length - 3).map((a) => {
              toBetDSMAIN = toBetDSMAIN.concat(dsCopy[a - 1]);
              return a;
          })
        : fetchedDSIndexes.map((a) => {
              toBetDSMAIN = toBetDSMAIN.concat(dsCopy[a - 1]);
              return a;
          });

// console.log('\n');
// console.log('STRAIGHTS: ', straights);
console.log('DERIVED_STRAIGHT_NUMS (Not sliced): ', derivedStraightNumbers);
console.log('DERIVED_SPLIT_INDEXES (Not sliced): ', derivedSplitIndexes);
console.log('DERIVED_STREET_INDEXES (Not sliced): ', derivedStreetIndexes);
console.log('DERIVED_DS_INDEXES (Not sliced): ', derivedDSindexes);

console.log('\n');

console.log('MUTATED_STRAIGHTS: ', straights);
console.log('MUTATED_SPLITS: ', splits);
console.log('MUTATED_STREETS: ', streets);
console.log('MUTATED_DS: ', DS);

console.log('\n');

console.log('UNMUTATED_STRAIGHTS: ', straightsCopy);
console.log('UNMUTATED_SPLITS: ', splitsCopy);
console.log('UNMUTATED_STREETS: ', streetsCopy);
console.log('UNMUTATED_DS: ', dsCopy);
console.log('\n');

console.log('O');

// // console.log('DERIVED_STRAIGHT_NUMS (Sliced): ', derivedStraightNumbers);
// // console.log('DERIVED_STREET_INDEXES (Sliced): ', derivedStreetIndexes);
// // console.log('DERIVED_DS_INDEXES (Sliced): ', derivedDSindexes);

console.log('\n');
console.log('TO_BET_STRAIGHT: ', toBetStraight);
console.log('TO_BET_SPLITS: ', toBetSplits);
console.log('TO_BET_STREETS: ', toBetStreets);
console.log('TO_BET_DS: ', toBetDS);

// console.log('SPLITS: ', splits);

// console.log('\n');
// console.log('StraightMain: ', fetchedStraightMain);
// console.log('SplitsIndexes: ', fetchedSplitsIndexes);
// console.log('StreetsIndexes: ', fetchedStreetsIndexes);
// console.log('DSIndexes: ', fetchedDSIndexes);

// console.log('TO_BET_STRAIGHT_MAIN: ', toBetStraightMAIN);
// console.log('TO_BET_SPLITS_MAIN: ', toBetSplitsMAIN);
// console.log('TO_BET_STREETS_MAIN: ', toBetStreetsMAIN);
// console.log('TO_BET_DS_MAIN: ', toBetDSMAIN);

let combinedDerived = [
    ...toBetStraight,
    ...toBetSplits,
    ...toBetStreets,
    ...toBetDS,
].reduce((acc, item) => {
    if (!acc[item]) acc[item] = 1;
    else {
        acc[item] += 1;
    }
    return acc;
}, {});
let combinedMain = [
    ...toBetStraightMAIN,
    ...toBetSplitsMAIN,
    ...toBetStreetsMAIN,
    ...toBetDSMAIN,
].reduce((acc, item) => {
    if (!acc[item]) acc[item] = 1;
    else {
        acc[item] += 1;
    }
    return acc;
}, {});

//combinedMain = combinedMain.filter(a => combinedMain[])

// console.log('MAIN_STRAIGHTS: ', fetchedStraightMain);
// console.log('MAIN_SPLITS_INDEXES: ', fetchedSplitsIndexes);
// console.log('MAIN_STREETS_INDEXES: ', fetchedStreetsIndexes);
// console.log('MAIN_DS_INDEXES: ', fetchedDSIndexes);

console.log('\n');
console.log('DERIVED: ', combinedDerived);

combinedDerived = [...Object.keys(combinedDerived)].reduce((acc, item) => {
    const score = combinedDerived[item];
    if (score >= 2) {
        acc.push(item);
    }
    return acc;
}, []);

combinedMain = [...Object.keys(combinedMain)].reduce((acc, item) => {
    const score = combinedMain[item];
    if (score >= 2) {
        acc.push(item);
    }
    return acc;
}, []);

console.log('\n');
console.log('DERIVED: ', combinedDerived);

function sortNumber15() {
    // find it's split position/index from unmutated board 9
    // find it's street position/index  from unmutated board 5
    // find it's DS position/index  from unmutated board 3
    // >>>>
    // POSTIONS OF NUMBER 15 IN SPLIT,STREET, DS = [10, 8, 3]
    // find it's split position/index from MUTATED board 1
    // find it's street position/index from MUTATED board  1
    // find it's DS position/index  from MUTATED board 1
}
// console.log('\n');
// console.log('MAIN: ', combinedMain);

// const toBet = [
//     ...Object.keys(combinedDerived),
//     ...Object.keys(combinedMain),
// ].reduce(
//     (acc, item) => {
//         const scoreDerived = combinedDerived[item];
//         const scoreMain = combinedMain[item];

//         if (scoreDerived >= 2) {
//             acc['DERIVED'].push(item);
//         }
//         if (scoreMain >= 2) {
//             acc['MAIN'].push(item);
//         }

//         // if (scoreMain >= 2 && scoreDerived >= 2) {
//         //     acc.push(item); // adds
//         //     // return acc; // removes
//         // }
//         // if (scoreMain === 1 && scoreDerived === 1) {
//         //     return acc; // removes
//         // } else {
//         //     if (!acc.includes(item)) acc.push(item); // adds
//         // }
//         return acc;
//     },
//     {
//         DERIVED: [],
//         MAIN: [],
//     }
// );

//console.log('TO_BET_NEXT: ', toBet);
