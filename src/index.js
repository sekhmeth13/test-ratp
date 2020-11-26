import express from "express"
import axios from "axios"
const YAML = require('yamljs');

const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = YAML.load(`${__dirname}/swagger.yaml`);

const port = 8000
const distantApiUrl = "https://data.ratp.fr/api/records/1.0/search/?dataset=positions-geographiques-des-stations-du-reseau-ratp&facet=stop_name"

 
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {explorer: true}));

app.get('/:name', async function(req, res) {
    const stationName = req.params.name;
    let {size, page} = req.query

    const params = {
        q: stationName,
    }

    if(size){
        params.rows = size
    }
    if(page){
        params.start = (size * (page-1))
    }
    
        try {
        const {data} = await axios({
            url: distantApiUrl,
            headers: {
                Accept: 'application/json'
              },
            params
            
        })
        const records = []
        let duplicatedCount = 0
        data.records.forEach(station => {
            const {recordid, fields} = station
            
            const recordToInsert = {
                gpsCoordinates: fields.stop_coordinates,
                name: fields.stop_name,
                description: fields.stop_desc,
                internalId: fields.stop_id
            }
            const indexExistingRecord = records.findIndex(record => {
                return record.name == fields.stop_name && 
                    record.description == fields.stop_desc &&
                    record.gpsCoordinates.length === fields.stop_coordinates.length &&
                    record.gpsCoordinates.every((value, index) => value === fields.stop_coordinates[index])
            })

            if(indexExistingRecord != -1) {
                if(!records[indexExistingRecord].hasOwnProperty('numberOfDuplicates')){
                    records[indexExistingRecord].numberOfDuplicates = 1
                } else {
                    records[indexExistingRecord].numberOfDuplicates += 1
                }
            }
            records.push(recordToInsert)
        });

        res.status(200).send(JSON.stringify(records), 200)
    } catch (error) {
        console.error(error);
    }
    
});


app.listen(port, () => {
    console.log(`The application is running @ http://localhost:${port}`)
  })
  