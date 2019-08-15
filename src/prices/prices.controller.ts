import { Controller, Get, Post, Delete, Patch, Body, Param, Put, HttpService } from '@nestjs/common';
import { PricesService } from './prices.service';
import { PricesEntity } from './prices.entity';
import { lasVegasData } from '../../sample_data/numbeo/lasVegas.js';
import { flightData } from '../../sample_data/Flights/flightData.js';
import { hotelsData } from '../../sample_data/Booking/hotelsInfo.js';
import { EnvModule } from '../env.module';
import { EnvService } from '../env.service';
import { findFieldsThatChangedTypeOnInputObjectTypes } from 'graphql/utilities/findBreakingChanges';
import { CitiesEntity } from 'src/cities/cities.entity';

const config = new EnvService().read();
@Controller('prices')
export class PricesController {
  constructor(private readonly PricesService: PricesService,
              private readonly http: HttpService,
    ) { }

  @Get('hotel/:qualityId/:city/:arrival/:departure')
  async root(@Param('city') city, @Param('arrival') arrival, @Param('departure') departure, @Param('qualityId') qualityId) {
    const headerRequest = {
      'x-rapidapi-key': config.AK_Booking,
    };
    // tslint:disable-next-line:max-line-length
    const response = await this.http.get(`https://apidojo-booking-v1.p.rapidapi.com/locations/auto-complete?text=${city}`, {headers: headerRequest}).toPromise();
    const cityId = response.data[0].dest_id;

    // tslint:disable-next-line:max-line-length
    const prices = await this.http.get(`https://apidojo-booking-v1.p.rapidapi.com/properties/list?search_type=city&offset=0&dest_ids=${cityId}&guest_qty=1&arrival_date=${arrival}&departure_date=${departure}&room_qty=1`, { headers: headerRequest }).toPromise();
    const date1 = new Date(arrival);
    const date2 = new Date(departure);
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    let quality;
    const lowQuality = prices.data.result.map(hotel => hotel.min_total_price).filter(price => price < 107 * diffDays && price > 0);
    const midQuality = prices.data.result.map(hotel => hotel.min_total_price).filter(price => price > 107 * diffDays && price < 143 * diffDays);
    const highQuality = prices.data.result.map(hotel => hotel.min_total_price).filter(price => price > 143 * diffDays);

    if (qualityId === '1'){
      quality = lowQuality;
    }
    if (qualityId === '2') {
      quality = midQuality;
    }
    if (qualityId === '3') {
      quality = highQuality;
    }

      const low = quality.reduce((low, hotel) => {
        if (low > hotel) {
          low = hotel;
        }
        return low;
      }); 
    const lowName = prices.data.result.filter(name => name.min_total_price === low)[0].hotel_name_trans;
    const lowAccom = prices.data.result.filter(name => name.min_total_price === low)[0].accommodation_type_name;
    const lowBusinessScore = prices.data.result.filter(name => name.min_total_price === low)[0].business_review_score_word;
    const lowUrl = prices.data.result.filter(name => name.min_total_price === low)[0].url;


    const high = quality.reduce((high, hotel) => {
        if (high < hotel) {
          high = hotel;
        }
        return high;
      });
    
    const highName = prices.data.result.filter(name => name.min_total_price === high)[0].hotel_name_trans;
    const highAccom = prices.data.result.filter(name => name.min_total_price === high)[0].accommodation_type_name;
    const highBusinessScore = prices.data.result.filter(name => name.min_total_price === high)[0].business_review_score_word;
    const highUrl = prices.data.result.filter(name => name.min_total_price === high)[0].url;

      const average = quality.reduce((ave, hotel) => {
        ave += hotel;
        return ave;
      }) / quality.length;

      const result = {
        low: Number(low.toFixed(2)),
        average: Number(average.toFixed(2)),
        high: Number(high.toFixed(2)),
        detail: {
          lowHotel: {
            name: lowName,
            accomodationType: lowAccom,
            businessScore: lowBusinessScore,
            URL: lowUrl
          },
          highHotel: {
            name: highName,
            accomodationType: highAccom,
            businessScore: highBusinessScore,
            URL: highUrl
          }
        }
      };
      return result;
  }

  @Get('flight/:qualityId/:flyFrom/:flyTo/:dateFrom/')
  async flightPrices(@Param('flyFrom') flyFrom, @Param('flyTo') flyTo, @Param('dateFrom') dateFrom, @Param('qualityId') qualityId) {
    // tslint:disable-next-line:max-line-length
    let classes = '';
    let cabinClass ='';
    if (qualityId === '1') {
      classes = 'e';
      cabinClass = 'Economy'
    }
    if (qualityId === '2') {
      classes = 'b';
      cabinClass = 'Business'
    }
    if (qualityId === '3') {
      classes = 'f';
      cabinClass = 'First Class'
    }
    const headerRequest = {
      'x-rapidapi-key': config.AK_Kayak,
    };
    // tslint:disable-next-line:max-line-length
    const origin = await this.http.get(`https://apidojo-kayak-v1.p.rapidapi.com/locations/search?where=${flyFrom}`, { headers: headerRequest }).toPromise();
    const originCode = origin.data[0].searchFormPrimary;
    // tslint:disable-next-line:max-line-length
    const destination = await this.http.get(`https://apidojo-kayak-v1.p.rapidapi.com/locations/search?where=${flyTo}`, { headers: headerRequest }).toPromise();
    const destinationCode = destination.data[0].searchFormPrimary;
    // tslint:disable-next-line:max-line-length
    const response = await this.http.get(`https://apidojo-kayak-v1.p.rapidapi.com/flights/create-session?origin1=${originCode}&destination1=${destinationCode}&departdate1=${dateFrom}&cabin=${classes}&currency=USD&adults=1&bags=0`, { headers: headerRequest }).toPromise();
    // console.log(response);
    const flights = response.data;

    const flightPrices = flights.tripset.map(price => price.exactLow).filter(num => num > 0).sort((a, b) => a - b);
    // const nameAir = response.data.tripset.map(name => name.exactLow).filter(num => num > 0).sort();
    const low = flightPrices[0];
    const lowAirline = flights.tripset.filter(num => num.exactLow === low)[0].cheapestProviderName;
    const lowOrigin = flights.tripset.filter(num => num.exactLow === low)[0].flightRoutes[0].originAirport;
    const lowDestination = flights.tripset.filter(num => num.exactLow === low)[0].flightRoutes[0].destinationAirport;
    const lowStops = flights.tripset.filter(num => num.exactLow === low)[0].maxstops;
    const lowURL = flights.tripset.filter(num => num.exactLow === low)[0].shareURL;



    // .map(name => name.cheapestProviderName)

    const high = flightPrices[flightPrices.length - 1];
    const highAirline = flights.tripset.filter(num => num.exactLow === high)[0].cheapestProviderName;
    const highOrigin = flights.tripset.filter(num => num.exactLow === high)[0].flightRoutes[0].originAirport;
    const highDestination = flights.tripset.filter(num => num.exactLow === high)[0].flightRoutes[0].destinationAirport;
    const highStops = flights.tripset.filter(num => num.exactLow === high)[0].maxstops;
    const highURL = flights.tripset.filter(num => num.exactLow === high)[0].shareURL;

    const average = flightPrices.reduce((ave, flight) => {
      ave += flight;
      return ave;
    }) / flightPrices.length
    let result = 
    {
      low: Number(low.toFixed(2)),
      average: Number(average.toFixed(2)),
      high: Number(high.toFixed(2)),
      detail: {
        lowFlight: {
          airline: lowAirline,
          stops: lowStops,
          cabin: cabinClass,
          flightPath: {
            origin: lowOrigin,
            destination: lowDestination,
          },
          URL: `https://www.kayak.com${lowURL}`
        },
        highFlight: {
          airline: highAirline,
          stops: highStops,
          cabin: cabinClass,
          flightPath: {
            origin: highOrigin,
            destination: highDestination,
          },
          URL: `https://www.kayak.com${highURL}`
        } 
    }
    }

    return result;
  }
  @Get('food/:city/:qualityId')
  async food(@Param('city') city, @Param('qualityId') qualityId){
    const response = await this.http.get(`http://www.numbeo.com:8008/api/city_prices?api_key=${config.AP_numbeo}&query=${city}`).toPromise()
    if (qualityId === '1'){
      const low = response.data.prices.filter(price => price.item_id === 1)[0].lowest_price;
      const mid = response.data.prices.filter(price => price.item_id === 1)[0].average_price;
      const high = response.data.prices.filter(price => price.item_id === 1)[0].highest_price;
      const lowFood ={
        low: Number(low.toFixed(2)),
        average: Number(mid.toFixed(2)),
        high: Number(high.toFixed(2)),
      };
      return lowFood;
    }
    if (qualityId === '2'){
      const low = response.data.prices.filter(price => price.item_id === 2)[0].lowest_price / 2;
      const mid = response.data.prices.filter(price => price.item_id === 2)[0].average_price / 2;
      const high = response.data.prices.filter(price => price.item_id === 2)[0].highest_price / 2;
      const midFood = {
        low: Number(low.toFixed(2)),
        average: Number(mid.toFixed(2)),
        high: Number(high.toFixed(2)),
      }
      return midFood;
    }
    if (qualityId === '3') {
      const low = response.data.prices.filter(price => price.item_id === 2)[0].lowest_price;
      const mid = response.data.prices.filter(price => price.item_id === 2)[0].average_price;
      const high = response.data.prices.filter(price => price.item_id === 2)[0].highest_price;
      const highFood = {
        low: Number(low.toFixed(2)),
        average: Number(mid.toFixed(2)),
        high: Number(high.toFixed(2)),
      }
      return highFood;
    }
  }
  @Get('cars/:origin/:pickup/:dropoff')
  async findCarPrices(@Param('origin') origin, @Param('pickup') pickup, @Param('dropoff') dropoff, @Param('qualityId') qualityId) {
    const headerRequest = {
      'x-rapidapi-key': config.AK_Kayak,
    };
    // tslint:disable-next-line:max-line-length
    const city = await this.http.get(`https://apidojo-kayak-v1.p.rapidapi.com/locations/search?where=${origin}`, { headers: headerRequest }).toPromise();
    const cityCode = city.data[0].searchFormPrimary;
    // tslint:disable-next-line:max-line-length
    const rentalCars = await this.http.get(`https://apidojo-kayak-v1.p.rapidapi.com/cars/create-session?originairportcode=${cityCode}&pickupdate=${pickup}&pickuphour=6&dropoffdate=${dropoff}&dropoffhour=6&currency=USD`, { headers: headerRequest }).toPromise();
    const car = rentalCars.data.carset;

    const carPrices = car.map(rental => Number(rental.displayFullPrice.slice(1, 4))).sort((a, b) => a - b);
    const lowPrice = carPrices[0];
    const highPrice = carPrices[carPrices.length - 1];
    const averagePrice = carPrices.reduce((avg, flight) => {
      avg += flight;
      return avg;
    }) / carPrices.length;

    const result = {
      low: Number(lowPrice.toFixed(2)),
      average: Number(averagePrice.toFixed(2)),
      high: Number(highPrice.toFixed(2)),
    };

    return result;
  }
  @Get('gas/:origin/:destination/')
  async gas(@Param('origin') origin, @Param('destination') destination) {
    const gasQuery = await this.http.get(`http://www.numbeo.com:8008/api/city_prices?api_key=${config.AP_numbeo}&query=${destination}`).toPromise();
    const gas = gasQuery.data.prices.filter(price => price.item_id === 24)[0].average_price * 3.78541;
    // tslint:disable-next-line:max-line-length
    const distanceQuery = await this.http.get(`https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${origin}&destinations=${destination}&key=${config.AP_google}`).toPromise();
    const distance = distanceQuery.data.rows[0].elements[0].distance.text;
    const distancePrice = distance.replace(/\D+/g, '');
    const time = distanceQuery.data.rows[0].elements[0].duration.text;

    const gasPrice = {
      gasPerGallon: gas,
      distance,
      distancePrice: Number((((Number(distancePrice)) / 23.6) * gas).toFixed(2)),
      time,
    };
    return gasPrice;
  }
    // gets all data from the prices table
  // @Get()
  // async findAll(): Promise<PricesEntity[]> {
  //   return this.PricesService.findAll();
  // }
  // // gets food prices from dummy data
  // @Get('food')
  // async findFood(): Promise<PricesEntity[]> {
  //   const low = Number((lasVegasData
  //   .prices
  //   .filter((food) => food.item_id === 1)[0]
  //     .lowest_price));

  //   const high = lasVegasData
  //     .prices
  //     .filter((food) => food.item_id === 1)[0]
  //     .highest_price;

  //   const average = (high + low) / 2;

  //   const food = [low.toFixed(2), average.toFixed(2), high.toFixed(2)];
  //   return food;
  // }

  // gets flight prices from dummy data
  // @Get('flight')
  // async findFlight(): Promise<PricesEntity[]> {
  //   const low = flightData[0]
  //   .data
  //   .reduce((low, flight) => {
  //     low = flight.price;
  //     if (low > flight.price) {
  //       low = flight.price;
  //     }
  //     return low;
  //   }, 0);

  //   const high = flightData[0]
  //     .data
  //     .reduce((high, flight) => {
  //       if (high <= flight.price) {
  //         high = flight.price;
  //       }
  //       return high;
  //     }, 0);

  //   const average = flightData[0]
  //     .data
  //     .reduce((average, flight) => {
  //       average += flight.price;

  //       return average;
  //     }, 0) / flightData[0].data.length;

  //   const flight = [low.toFixed(2), average.toFixed(2), high.toFixed(2)];

  //   return flight;
  // }

  // @Get('hotel')
  // async findHotel(): Promise<PricesEntity[]> {

  //   const prices = hotelsData.result
  //   .map((hotels) => {
  //     return hotels.min_total_price;
  //   }).filter(price => price < 1500 && price > 0);

  //   const low = (prices
  //   .reduce((low, hotel) => {
  //     if (low > hotel) {
  //       low = hotel;
  //     }
  //     return low;
  //   }));

  //   const high = prices
  //   .reduce((low, hotel) => {
  //     if (low < hotel) {
  //       low = hotel;
  //     }
  //     return low;
  //   });

  //   const average = (prices
  //   .reduce((low, hotel) => {
  //     low += hotel;
  //     return low;
  //   }, 0) / prices.length);

  //   const hotel = [low.toFixed(2), average.toFixed(2), high.toFixed(2)];

  //   return hotel;
  // }

    // gets specific prices from table based on id
  // @Get(':id')
  // async read(@Param('id') id): Promise<PricesEntity> {
  //   return this.PricesService.read(id);
  // }

  // // posts data into prices table
  // @Post('create')
  // async create(@Body() pricesData: PricesEntity): Promise<any> {
  //   return this.PricesService.create(pricesData);
  // }

  //   // updates data based on prices id
  // @Put(':id/')
  // async update(@Param('id') id, @Body() pricesData: PricesEntity): Promise<any> {
  //   pricesData.id = Number(id);
  //   console.log('Update #' + pricesData.id);
  //   return this.PricesService.update(pricesData);
  // }

  //   // deletes data based on prices id
  // @Delete(':id/')
  // async delete(@Param('id') id): Promise<any> {
  //   return this.PricesService.delete(id);
  // }

}
