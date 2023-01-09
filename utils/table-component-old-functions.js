// // Need to complete START
// if (rowName === 'EFFICIENCY (30%)') {
//     tds.slice(1).map((td, i) => {
//         const alt = td.children.find(
//             (a) => a.name === 'img'
//         ).attribs.alt;
//         const score = alt.slice(0, 2).trim();
//         comparison.items[i].efficiencyScore =
//             Number(score);
//         return td;
//     });
// }
// if (
//     rowName === 'EASE OF USE & INSTALLATION (40%)'
// ) {
//     tds.slice(1).map((td, i) => {
//         const alt = td.children.find(
//             (a) => a.name === 'img'
//         ).attribs.alt;
//         const score = alt.slice(0, 2).trim();
//         comparison.items[i].efficiencyScore =
//             Number(score);
//         return td;
//     });
// }
// if (rowName === 'EXTRAS (30%)') {
//     tds.slice(1).map((td, i) => {
//         const alt = td.children.find(
//             (a) => a.name === 'img'
//         ).attribs.alt;
//         const score = alt.slice(0, 2).trim();
//         comparison.items[i].efficiencyScore =
//             Number(score);
//         return td;
//     });
// }
// // Need to complete END
// if (rowName === 'PRODUCT SPECIFICATIONS') {
//     tds.slice(1).map(
//         (td, i) =>
//             (comparison.items[i].specifications =
//                 formatText(
//                     td.children[0].children[0].data
//                 ))
//     );
// }
// if (rowName === 'DIMENSIONS') {
//     tds.slice(1).map(
//         (td, i) =>
//             (comparison.items[i].dimensions =
//                 formatText(td.children[0].data))
//     );
// }
// if (rowName === 'CAPACITY') {
//     tds.slice(1).map(
//         (td, i) =>
//             (comparison.items[i].capacity =
//                 formatText(td.children[0].data))
//     );
// }
// if (rowName === 'INCLUDED COMPONENTS') {
//     tds.slice(1).map(
//         (td, i) =>
//             (comparison.items[
//                 i
//             ].includedComponents = formatText(
//                 td.children[0].data
//             ))
//     );
// }
