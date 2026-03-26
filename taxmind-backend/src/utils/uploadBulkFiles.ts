// import byteSize from 'byte-size';
// import { uploadFile } from 'integrations/awsS3';

// export const uploadBulkFiles = async (files) => {
//   const fileUploadPromises = [];
//   const uploadedFiles = [];

//   const uploadFileFn = (_) => {
//     return new Promise((resolve, reject) => {
//       _.upload
//         .then((result) => {
//           uploadedFiles.push({
//             file: _.file,
//             uploadedFile: result,
//           });
//           resolve(result);
//         })
//         .catch((err) => {
//           reject(err);
//         });
//     });
//   };

//   files.forEach((file) => {
//     fileUploadPromises.push(
//       uploadFileFn({
//         file: file,
//         upload: uploadFile(file.buffer, file.originalname),
//       })
//     );
//   });
//   await Promise.all(fileUploadPromises);

//   const formattedUploadedData = uploadedFiles.map((_) => ({
//     path: _.uploadedFile,
//     metadata: {
//       file_name: _.file.originalname,
//       file_type: _.file.mimetype,
//       file_size: byteSize(_.file.size).toString(),
//     },
//   }));

//   return formattedUploadedData;
// };
