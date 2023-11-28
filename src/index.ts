import {env} from 'process';
import {get} from 'https';
import {IncomingMessage} from 'http';
import {createWriteStream, existsSync, mkdir, writeFile} from 'fs';
import {join} from 'path';

/**
 * Fetches and saves the map dataset to the specified location.
 *
 * @param url the url from of the map dataset
 * @param out the the destination of the map dataset JSON file
 * @returns a resolved promise if everything goes well, or a rejected promise with the error as its reason
 */
export default function updateMapDataSet(
  url?: string,
  out?: string
): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    try {
      const defaultJsonUrl =
        env.MAP_DATASET_URL ??
        'https://raw.githubusercontent.com/amargon/city-of-doors/master/source/data/en/map.json';
      const jsonUrl = url ?? defaultJsonUrl;
      const defaultOutDir: string =
        env.MAP_DATASET_DEST ?? join(__dirname, 'dataset');
      const outDir = out ?? defaultOutDir;

      get(jsonUrl, res => {
        console.log(`Received response from ${jsonUrl}.`);
        saveFileFromMessage(res, outDir)
          .then(() => console.log('File Successfully Saved!'))
          .catch(reason => {
            console.error(reason);
            throw new Error(reason);
          });
      })
        .on('finish', () => resolve(true))
        .on('error', error => {
          console.error(
            'GET ERROR. Caught Exception while requesting the data: ',
            error
          );
          throw error;
        });
    } catch (error) {
      console.error('Caught Exception from updateMapDataSet: ', error);
      reject(error);
    }
  });
}

/**
 * Saves the file from an IncomingMessage stream.
 *
 * @param inc the incoming message as a stream
 * @param dest the destination of the file
 * @returns resolved if everything goes well, or rejected with the error as its reason
 */
function saveFileFromMessage(
  inc: IncomingMessage,
  dest?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const defaultDestination: string =
        env.MAP_DATASET_DEST ?? join(__dirname, 'dataset');
      const destination = dest ?? defaultDestination;
      const mapName: string = env.MAP_DATASET_FILENAME ?? 'map.json';

      createFileIfNotExists(destination, mapName).then(() => {
        const file = createWriteStream(join(destination, mapName), {
          autoClose: true,
        });
        inc.pipe(file);
        file
          .on('finish', () => file.close(() => resolve()))
          .on('error', error => {
            console.error('Error while saving map dataset to destination.');
            throw error;
          });
      });
    } catch (error) {
      console.error('Caught exception: ', error);
      reject(error);
    }
  });
}

/**
 * Recursively creates the needed directories for the file, then creates the file itself, as an empty utf-8 encoded file.
 *
 * @param destination the destination of the file to be created
 * @param name the name of the file
 * @returns resolved if everything goes well, and rejected with the error as its reason
 */
function createFileIfNotExists(
  destination: string,
  name: string
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      if (!existsSync(destination)) {
        console.log(
          "Directory doesn't exist. Creating directory at destination: ",
          destination
        );
        mkdir(destination, {recursive: true}, (error, destination) => {
          if (destination) {
            console.log(`Non-existing directory created. ${destination}`);
            writeFile(join(destination, name), '', {encoding: 'utf-8'}, () =>
              console.log(
                `Created file named "${name}", inside: ${destination}`
              )
            );
          }
          if (error) {
            console.error(
              'Error while trying to create the directory: ',
              error
            );
            throw error;
          }
        });
      }
    } catch (error) {
      console.error('Caught Exception. Inside createFileIfNotExists', error);
      reject(error);
    }
    resolve();
  });
}

updateMapDataSet();
