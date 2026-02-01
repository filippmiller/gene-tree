/**
 * Coordinates Lookup
 *
 * Maps city/country names to lat/lng coordinates.
 * Covers major cities across North America, Europe, and Russia.
 */

import type { Coordinates } from './types';

// Major cities database with coordinates
const CITY_COORDINATES: Record<string, Coordinates> = {
  // United States - Major Cities
  'new york': { lat: 40.7128, lng: -74.006 },
  'new york city': { lat: 40.7128, lng: -74.006 },
  'nyc': { lat: 40.7128, lng: -74.006 },
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  'la': { lat: 34.0522, lng: -118.2437 },
  'chicago': { lat: 41.8781, lng: -87.6298 },
  'houston': { lat: 29.7604, lng: -95.3698 },
  'phoenix': { lat: 33.4484, lng: -112.074 },
  'philadelphia': { lat: 39.9526, lng: -75.1652 },
  'san antonio': { lat: 29.4241, lng: -98.4936 },
  'san diego': { lat: 32.7157, lng: -117.1611 },
  'dallas': { lat: 32.7767, lng: -96.797 },
  'san jose': { lat: 37.3382, lng: -121.8863 },
  'austin': { lat: 30.2672, lng: -97.7431 },
  'jacksonville': { lat: 30.3322, lng: -81.6557 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  'seattle': { lat: 47.6062, lng: -122.3321 },
  'denver': { lat: 39.7392, lng: -104.9903 },
  'boston': { lat: 42.3601, lng: -71.0589 },
  'miami': { lat: 25.7617, lng: -80.1918 },
  'atlanta': { lat: 33.749, lng: -84.388 },
  'las vegas': { lat: 36.1699, lng: -115.1398 },
  'portland': { lat: 45.5152, lng: -122.6784 },
  'detroit': { lat: 42.3314, lng: -83.0458 },
  'minneapolis': { lat: 44.9778, lng: -93.265 },
  'cleveland': { lat: 41.4993, lng: -81.6944 },
  'baltimore': { lat: 39.2904, lng: -76.6122 },
  'pittsburgh': { lat: 40.4406, lng: -79.9959 },
  'st louis': { lat: 38.627, lng: -90.1994 },
  'saint louis': { lat: 38.627, lng: -90.1994 },
  'washington': { lat: 38.9072, lng: -77.0369 },
  'washington dc': { lat: 38.9072, lng: -77.0369 },
  'dc': { lat: 38.9072, lng: -77.0369 },

  // Canada
  'toronto': { lat: 43.6532, lng: -79.3832 },
  'montreal': { lat: 45.5017, lng: -73.5673 },
  'vancouver': { lat: 49.2827, lng: -123.1207 },
  'calgary': { lat: 51.0447, lng: -114.0719 },
  'ottawa': { lat: 45.4215, lng: -75.6972 },

  // Russia - Major Cities
  'moscow': { lat: 55.7558, lng: 37.6173 },
  'moskva': { lat: 55.7558, lng: 37.6173 },
  'saint petersburg': { lat: 59.9343, lng: 30.3351 },
  'st petersburg': { lat: 59.9343, lng: 30.3351 },
  'petersburg': { lat: 59.9343, lng: 30.3351 },
  'novosibirsk': { lat: 55.0084, lng: 82.9357 },
  'yekaterinburg': { lat: 56.8389, lng: 60.6057 },
  'ekaterinburg': { lat: 56.8389, lng: 60.6057 },
  'kazan': { lat: 55.8304, lng: 49.0661 },
  'nizhny novgorod': { lat: 56.2965, lng: 43.9361 },
  'chelyabinsk': { lat: 55.1644, lng: 61.4368 },
  'samara': { lat: 53.1959, lng: 50.1002 },
  'omsk': { lat: 54.9885, lng: 73.3242 },
  'rostov-on-don': { lat: 47.2357, lng: 39.7015 },
  'rostov': { lat: 47.2357, lng: 39.7015 },
  'ufa': { lat: 54.7388, lng: 55.9721 },
  'krasnoyarsk': { lat: 56.0153, lng: 92.8932 },
  'voronezh': { lat: 51.6755, lng: 39.2089 },
  'perm': { lat: 58.0105, lng: 56.2502 },
  'volgograd': { lat: 48.708, lng: 44.5133 },
  'krasnodar': { lat: 45.0355, lng: 38.975 },
  'saratov': { lat: 51.5331, lng: 46.0342 },
  'tyumen': { lat: 57.1553, lng: 68.4656 },
  'tolyatti': { lat: 53.5303, lng: 49.3461 },
  'izhevsk': { lat: 56.8527, lng: 53.2112 },
  'barnaul': { lat: 53.3548, lng: 83.7698 },
  'ulyanovsk': { lat: 54.3143, lng: 48.4033 },
  'irkutsk': { lat: 52.2855, lng: 104.289 },
  'vladivostok': { lat: 43.1056, lng: 131.8735 },
  'yaroslavl': { lat: 57.6299, lng: 39.8737 },
  'khabarovsk': { lat: 48.4827, lng: 135.0837 },
  'makhachkala': { lat: 42.9849, lng: 47.5047 },
  'tomsk': { lat: 56.4846, lng: 84.9476 },
  'orenburg': { lat: 51.7879, lng: 55.1015 },
  'kemerovo': { lat: 55.3549, lng: 86.0877 },
  'ryazan': { lat: 54.6269, lng: 39.6916 },
  'astrakhan': { lat: 46.3497, lng: 48.0408 },
  'penza': { lat: 53.1959, lng: 45.0183 },
  'naberezhnye chelny': { lat: 55.7, lng: 52.3167 },
  'lipetsk': { lat: 52.6167, lng: 39.6 },
  'tula': { lat: 54.2044, lng: 37.6186 },
  'kirov': { lat: 58.6035, lng: 49.668 },
  'cheboksary': { lat: 56.1439, lng: 47.2489 },
  'kaliningrad': { lat: 54.7104, lng: 20.4522 },
  'bryansk': { lat: 53.2521, lng: 34.3717 },
  'kursk': { lat: 51.7303, lng: 36.1929 },
  'ivanovo': { lat: 56.9972, lng: 40.9714 },
  'magnitogorsk': { lat: 53.4072, lng: 58.9789 },
  'tver': { lat: 56.8587, lng: 35.9176 },
  'nizhny tagil': { lat: 57.9094, lng: 59.9653 },
  'stavropol': { lat: 45.0428, lng: 41.9734 },
  'belgorod': { lat: 50.5997, lng: 36.5986 },
  'sochi': { lat: 43.5992, lng: 39.7257 },
  'arkhangelsk': { lat: 64.5401, lng: 40.5433 },
  'vladimir': { lat: 56.1365, lng: 40.3966 },
  'sevastopol': { lat: 44.6166, lng: 33.5254 },
  'murmansk': { lat: 68.9585, lng: 33.0827 },
  'surgut': { lat: 61.254, lng: 73.3964 },
  'smolensk': { lat: 54.7903, lng: 32.0503 },
  'orel': { lat: 52.9651, lng: 36.0785 },
  'vologda': { lat: 59.2181, lng: 39.8886 },
  'cherepovets': { lat: 59.1269, lng: 37.9098 },
  'tambov': { lat: 52.7317, lng: 41.4433 },
  'sterlitamak': { lat: 53.63, lng: 55.95 },
  'saransk': { lat: 54.1838, lng: 45.1749 },
  'yoshkar-ola': { lat: 56.6344, lng: 47.8995 },
  'petrozavodsk': { lat: 61.7849, lng: 34.3469 },
  'kostroma': { lat: 57.7678, lng: 40.9269 },
  'novorossiysk': { lat: 44.7167, lng: 37.7833 },
  'nizhnevartovsk': { lat: 60.9344, lng: 76.5531 },
  'noyabrsk': { lat: 63.1929, lng: 75.4509 },
  'novokuznetsk': { lat: 53.7596, lng: 87.1216 },
  'prokopyevsk': { lat: 53.9, lng: 86.7333 },
  'blagoveshchensk': { lat: 50.2667, lng: 127.5333 },
  'yakutsk': { lat: 62.0355, lng: 129.6755 },
  'norilsk': { lat: 69.35, lng: 88.2 },
  'komsomolsk-on-amur': { lat: 50.55, lng: 137.0167 },
  'petropavlovsk-kamchatsky': { lat: 53.0167, lng: 158.65 },
  'yuzhno-sakhalinsk': { lat: 46.9594, lng: 142.7381 },

  // Cyrillic Russian names
  'москва': { lat: 55.7558, lng: 37.6173 },
  'санкт-петербург': { lat: 59.9343, lng: 30.3351 },
  'новосибирск': { lat: 55.0084, lng: 82.9357 },
  'екатеринбург': { lat: 56.8389, lng: 60.6057 },
  'казань': { lat: 55.8304, lng: 49.0661 },
  'нижний новгород': { lat: 56.2965, lng: 43.9361 },
  'самара': { lat: 53.1959, lng: 50.1002 },
  'омск': { lat: 54.9885, lng: 73.3242 },
  'ростов-на-дону': { lat: 47.2357, lng: 39.7015 },
  'уфа': { lat: 54.7388, lng: 55.9721 },
  'красноярск': { lat: 56.0153, lng: 92.8932 },
  'воронеж': { lat: 51.6755, lng: 39.2089 },
  'пермь': { lat: 58.0105, lng: 56.2502 },
  'волгоград': { lat: 48.708, lng: 44.5133 },
  'краснодар': { lat: 45.0355, lng: 38.975 },
  'саратов': { lat: 51.5331, lng: 46.0342 },
  'тюмень': { lat: 57.1553, lng: 68.4656 },
  'тольятти': { lat: 53.5303, lng: 49.3461 },
  'ижевск': { lat: 56.8527, lng: 53.2112 },
  'барнаул': { lat: 53.3548, lng: 83.7698 },
  'ульяновск': { lat: 54.3143, lng: 48.4033 },
  'иркутск': { lat: 52.2855, lng: 104.289 },
  'владивосток': { lat: 43.1056, lng: 131.8735 },
  'ярославль': { lat: 57.6299, lng: 39.8737 },
  'хабаровск': { lat: 48.4827, lng: 135.0837 },
  'махачкала': { lat: 42.9849, lng: 47.5047 },
  'томск': { lat: 56.4846, lng: 84.9476 },
  'оренбург': { lat: 51.7879, lng: 55.1015 },
  'кемерово': { lat: 55.3549, lng: 86.0877 },
  'рязань': { lat: 54.6269, lng: 39.6916 },
  'астрахань': { lat: 46.3497, lng: 48.0408 },
  'пенза': { lat: 53.1959, lng: 45.0183 },
  'набережные челны': { lat: 55.7, lng: 52.3167 },
  'липецк': { lat: 52.6167, lng: 39.6 },
  'тула': { lat: 54.2044, lng: 37.6186 },
  'киров': { lat: 58.6035, lng: 49.668 },
  'чебоксары': { lat: 56.1439, lng: 47.2489 },
  'калининград': { lat: 54.7104, lng: 20.4522 },
  'брянск': { lat: 53.2521, lng: 34.3717 },
  'курск': { lat: 51.7303, lng: 36.1929 },
  'иваново': { lat: 56.9972, lng: 40.9714 },
  'магнитогорск': { lat: 53.4072, lng: 58.9789 },
  'тверь': { lat: 56.8587, lng: 35.9176 },
  'нижний тагил': { lat: 57.9094, lng: 59.9653 },
  'ставрополь': { lat: 45.0428, lng: 41.9734 },
  'белгород': { lat: 50.5997, lng: 36.5986 },
  'сочи': { lat: 43.5992, lng: 39.7257 },
  'архангельск': { lat: 64.5401, lng: 40.5433 },
  'владимир': { lat: 56.1365, lng: 40.3966 },
  'севастополь': { lat: 44.6166, lng: 33.5254 },
  'мурманск': { lat: 68.9585, lng: 33.0827 },
  'смоленск': { lat: 54.7903, lng: 32.0503 },
  'орёл': { lat: 52.9651, lng: 36.0785 },
  'вологда': { lat: 59.2181, lng: 39.8886 },
  'череповец': { lat: 59.1269, lng: 37.9098 },
  'тамбов': { lat: 52.7317, lng: 41.4433 },
  'саранск': { lat: 54.1838, lng: 45.1749 },
  'йошкар-ола': { lat: 56.6344, lng: 47.8995 },
  'петрозаводск': { lat: 61.7849, lng: 34.3469 },
  'кострома': { lat: 57.7678, lng: 40.9269 },
  'новороссийск': { lat: 44.7167, lng: 37.7833 },
  'новокузнецк': { lat: 53.7596, lng: 87.1216 },
  'прокопьевск': { lat: 53.9, lng: 86.7333 },
  'благовещенск': { lat: 50.2667, lng: 127.5333 },
  'якутск': { lat: 62.0355, lng: 129.6755 },
  'норильск': { lat: 69.35, lng: 88.2 },
  'комсомольск-на-амуре': { lat: 50.55, lng: 137.0167 },
  'петропавловск-камчатский': { lat: 53.0167, lng: 158.65 },
  'южно-сахалинск': { lat: 46.9594, lng: 142.7381 },
  'сургут': { lat: 61.254, lng: 73.3964 },
  'нижневартовск': { lat: 60.9344, lng: 76.5531 },
  'ноябрьск': { lat: 63.1929, lng: 75.4509 },
  'стерлитамак': { lat: 53.63, lng: 55.95 },
  'челябинск': { lat: 55.1644, lng: 61.4368 },

  // European Countries & Capitals
  'london': { lat: 51.5074, lng: -0.1278 },
  'paris': { lat: 48.8566, lng: 2.3522 },
  'berlin': { lat: 52.52, lng: 13.405 },
  'madrid': { lat: 40.4168, lng: -3.7038 },
  'rome': { lat: 41.9028, lng: 12.4964 },
  'vienna': { lat: 48.2082, lng: 16.3738 },
  'amsterdam': { lat: 52.3676, lng: 4.9041 },
  'brussels': { lat: 50.8503, lng: 4.3517 },
  'warsaw': { lat: 52.2297, lng: 21.0122 },
  'prague': { lat: 50.0755, lng: 14.4378 },
  'budapest': { lat: 47.4979, lng: 19.0402 },
  'bucharest': { lat: 44.4268, lng: 26.1025 },
  'sofia': { lat: 42.6977, lng: 23.3219 },
  'athens': { lat: 37.9838, lng: 23.7275 },
  'lisbon': { lat: 38.7223, lng: -9.1393 },
  'stockholm': { lat: 59.3293, lng: 18.0686 },
  'oslo': { lat: 59.9139, lng: 10.7522 },
  'copenhagen': { lat: 55.6761, lng: 12.5683 },
  'helsinki': { lat: 60.1699, lng: 24.9384 },
  'dublin': { lat: 53.3498, lng: -6.2603 },
  'edinburgh': { lat: 55.9533, lng: -3.1883 },
  'glasgow': { lat: 55.8642, lng: -4.2518 },
  'manchester': { lat: 53.4808, lng: -2.2426 },
  'birmingham': { lat: 52.4862, lng: -1.8904 },
  'munich': { lat: 48.1351, lng: 11.582 },
  'frankfurt': { lat: 50.1109, lng: 8.6821 },
  'hamburg': { lat: 53.5511, lng: 9.9937 },
  'cologne': { lat: 50.9375, lng: 6.9603 },
  'milan': { lat: 45.4642, lng: 9.19 },
  'naples': { lat: 40.8518, lng: 14.2681 },
  'barcelona': { lat: 41.3851, lng: 2.1734 },
  'valencia': { lat: 39.4699, lng: -0.3763 },
  'zurich': { lat: 47.3769, lng: 8.5417 },
  'geneva': { lat: 46.2044, lng: 6.1432 },

  // Ukraine
  'kyiv': { lat: 50.4501, lng: 30.5234 },
  'kiev': { lat: 50.4501, lng: 30.5234 },
  'kharkiv': { lat: 49.9935, lng: 36.2304 },
  'odessa': { lat: 46.4825, lng: 30.7233 },
  'odesa': { lat: 46.4825, lng: 30.7233 },
  'dnipro': { lat: 48.4647, lng: 35.0462 },
  'lviv': { lat: 49.8397, lng: 24.0297 },
  'donetsk': { lat: 48.0159, lng: 37.8029 },
  'zaporizhzhia': { lat: 47.8388, lng: 35.1396 },
  'mykolaiv': { lat: 46.975, lng: 31.9946 },
  'mariupol': { lat: 47.0951, lng: 37.5492 },
  'luhansk': { lat: 48.574, lng: 39.3078 },
  'vinnytsia': { lat: 49.2331, lng: 28.4682 },
  'simferopol': { lat: 44.9521, lng: 34.1024 },
  'kherson': { lat: 46.6354, lng: 32.6169 },
  'poltava': { lat: 49.5883, lng: 34.5514 },
  'chernihiv': { lat: 51.4982, lng: 31.2893 },
  'cherkasy': { lat: 49.4285, lng: 32.062 },
  'sumy': { lat: 50.9077, lng: 34.7981 },
  'zhytomyr': { lat: 50.2547, lng: 28.6587 },
  'rivne': { lat: 50.6199, lng: 26.2516 },
  'ivano-frankivsk': { lat: 48.9226, lng: 24.7111 },
  'ternopil': { lat: 49.5535, lng: 25.5948 },
  'lutsk': { lat: 50.7472, lng: 25.3254 },
  'uzhhorod': { lat: 48.6208, lng: 22.2879 },

  // Cyrillic Ukrainian names
  'київ': { lat: 50.4501, lng: 30.5234 },
  'харків': { lat: 49.9935, lng: 36.2304 },
  'одеса': { lat: 46.4825, lng: 30.7233 },
  'дніпро': { lat: 48.4647, lng: 35.0462 },
  'львів': { lat: 49.8397, lng: 24.0297 },
  'донецьк': { lat: 48.0159, lng: 37.8029 },
  'запоріжжя': { lat: 47.8388, lng: 35.1396 },
  'миколаїв': { lat: 46.975, lng: 31.9946 },
  'маріуполь': { lat: 47.0951, lng: 37.5492 },
  'луганськ': { lat: 48.574, lng: 39.3078 },
  'вінниця': { lat: 49.2331, lng: 28.4682 },
  'сімферополь': { lat: 44.9521, lng: 34.1024 },
  'херсон': { lat: 46.6354, lng: 32.6169 },
  'полтава': { lat: 49.5883, lng: 34.5514 },
  'чернігів': { lat: 51.4982, lng: 31.2893 },
  'черкаси': { lat: 49.4285, lng: 32.062 },
  'суми': { lat: 50.9077, lng: 34.7981 },
  'житомир': { lat: 50.2547, lng: 28.6587 },
  'рівне': { lat: 50.6199, lng: 26.2516 },
  'івано-франківськ': { lat: 48.9226, lng: 24.7111 },
  'тернопіль': { lat: 49.5535, lng: 25.5948 },
  'луцьк': { lat: 50.7472, lng: 25.3254 },
  'ужгород': { lat: 48.6208, lng: 22.2879 },

  // Belarus
  'minsk': { lat: 53.9006, lng: 27.559 },
  'gomel': { lat: 52.4345, lng: 30.9754 },
  'mogilev': { lat: 53.8942, lng: 30.3446 },
  'vitebsk': { lat: 55.1904, lng: 30.2049 },
  'grodno': { lat: 53.6779, lng: 23.8293 },
  'brest': { lat: 52.0976, lng: 23.7341 },

  // Cyrillic Belarusian
  'мінск': { lat: 53.9006, lng: 27.559 },
  'минск': { lat: 53.9006, lng: 27.559 },
  'гомель': { lat: 52.4345, lng: 30.9754 },
  'могилёв': { lat: 53.8942, lng: 30.3446 },
  'витебск': { lat: 55.1904, lng: 30.2049 },
  'гродно': { lat: 53.6779, lng: 23.8293 },
  'брест': { lat: 52.0976, lng: 23.7341 },

  // Baltic States
  'tallinn': { lat: 59.437, lng: 24.7536 },
  'riga': { lat: 56.9496, lng: 24.1052 },
  'vilnius': { lat: 54.6872, lng: 25.2797 },
  'kaunas': { lat: 54.8985, lng: 23.9036 },

  // Central Asia
  'almaty': { lat: 43.2551, lng: 76.9126 },
  'nur-sultan': { lat: 51.1694, lng: 71.4491 },
  'astana': { lat: 51.1694, lng: 71.4491 },
  'tashkent': { lat: 41.2995, lng: 69.2401 },
  'bishkek': { lat: 42.8746, lng: 74.5698 },
  'dushanbe': { lat: 38.5598, lng: 68.774 },
  'ashgabat': { lat: 37.9601, lng: 58.3261 },

  // Caucasus
  'tbilisi': { lat: 41.7151, lng: 44.8271 },
  'yerevan': { lat: 40.1792, lng: 44.4991 },
  'baku': { lat: 40.4093, lng: 49.8671 },

  // Israel
  'tel aviv': { lat: 32.0853, lng: 34.7818 },
  'jerusalem': { lat: 31.7683, lng: 35.2137 },
  'haifa': { lat: 32.794, lng: 34.9896 },
  'beer sheva': { lat: 31.2518, lng: 34.7913 },
  'netanya': { lat: 32.3215, lng: 34.8532 },
  'ashdod': { lat: 31.8044, lng: 34.6553 },
  'bnei brak': { lat: 32.0833, lng: 34.8333 },
  'holon': { lat: 32.0167, lng: 34.7833 },
  'ramat gan': { lat: 32.0833, lng: 34.8167 },
  'petah tikva': { lat: 32.0889, lng: 34.8864 },
  'eilat': { lat: 29.5581, lng: 34.9482 },

  // Cyrillic Israel names
  'тель-авив': { lat: 32.0853, lng: 34.7818 },
  'иерусалим': { lat: 31.7683, lng: 35.2137 },
  'хайфа': { lat: 32.794, lng: 34.9896 },

  // Germany detailed
  'düsseldorf': { lat: 51.2277, lng: 6.7735 },
  'dusseldorf': { lat: 51.2277, lng: 6.7735 },
  'leipzig': { lat: 51.3397, lng: 12.3731 },
  'stuttgart': { lat: 48.7758, lng: 9.1829 },
  'dortmund': { lat: 51.5136, lng: 7.4653 },
  'essen': { lat: 51.4556, lng: 7.0116 },
  'bremen': { lat: 53.0793, lng: 8.8017 },
  'dresden': { lat: 51.0504, lng: 13.7373 },
  'hannover': { lat: 52.3759, lng: 9.732 },
  'nuremberg': { lat: 49.4521, lng: 11.0767 },
  'nurnberg': { lat: 49.4521, lng: 11.0767 },

  // Ireland detailed
  'cork': { lat: 51.8985, lng: -8.4756 },
  'limerick': { lat: 52.668, lng: -8.6305 },
  'galway': { lat: 53.2707, lng: -9.0568 },
  'waterford': { lat: 52.2593, lng: -7.1101 },

  // Poland detailed
  'krakow': { lat: 50.0647, lng: 19.945 },
  'lodz': { lat: 51.7592, lng: 19.456 },
  'wroclaw': { lat: 51.1079, lng: 17.0385 },
  'poznan': { lat: 52.4064, lng: 16.9252 },
  'gdansk': { lat: 54.352, lng: 18.6466 },
  'szczecin': { lat: 53.4285, lng: 14.5528 },
  'bydgoszcz': { lat: 53.1235, lng: 18.0084 },
  'lublin': { lat: 51.2465, lng: 22.5684 },
  'katowice': { lat: 50.2649, lng: 19.0238 },

  // Mexico
  'mexico city': { lat: 19.4326, lng: -99.1332 },
  'guadalajara': { lat: 20.6597, lng: -103.3496 },
  'monterrey': { lat: 25.6866, lng: -100.3161 },
  'tijuana': { lat: 32.5149, lng: -117.0382 },
  'puebla': { lat: 19.0414, lng: -98.2063 },
  'cancun': { lat: 21.1619, lng: -86.8515 },

  // South America
  'buenos aires': { lat: -34.6037, lng: -58.3816 },
  'sao paulo': { lat: -23.5505, lng: -46.6333 },
  'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
  'bogota': { lat: 4.711, lng: -74.0721 },
  'lima': { lat: -12.0464, lng: -77.0428 },
  'santiago': { lat: -33.4489, lng: -70.6693 },
  'caracas': { lat: 10.4806, lng: -66.9036 },
  'montevideo': { lat: -34.9011, lng: -56.1645 },

  // Asia
  'tokyo': { lat: 35.6762, lng: 139.6503 },
  'beijing': { lat: 39.9042, lng: 116.4074 },
  'shanghai': { lat: 31.2304, lng: 121.4737 },
  'hong kong': { lat: 22.3193, lng: 114.1694 },
  'singapore': { lat: 1.3521, lng: 103.8198 },
  'seoul': { lat: 37.5665, lng: 126.978 },
  'taipei': { lat: 25.033, lng: 121.5654 },
  'bangkok': { lat: 13.7563, lng: 100.5018 },
  'mumbai': { lat: 19.076, lng: 72.8777 },
  'delhi': { lat: 28.7041, lng: 77.1025 },
  'new delhi': { lat: 28.6139, lng: 77.209 },

  // Australia
  'sydney': { lat: -33.8688, lng: 151.2093 },
  'melbourne': { lat: -37.8136, lng: 144.9631 },
  'brisbane': { lat: -27.4698, lng: 153.0251 },
  'perth': { lat: -31.9505, lng: 115.8605 },
  'auckland': { lat: -36.8485, lng: 174.7633 },
  'wellington': { lat: -41.2865, lng: 174.7762 },

  // Africa
  'cairo': { lat: 30.0444, lng: 31.2357 },
  'johannesburg': { lat: -26.2041, lng: 28.0473 },
  'cape town': { lat: -33.9249, lng: 18.4241 },
  'lagos': { lat: 6.5244, lng: 3.3792 },
  'nairobi': { lat: -1.2921, lng: 36.8219 },
  'casablanca': { lat: 33.5731, lng: -7.5898 },

  // Middle East
  'dubai': { lat: 25.2048, lng: 55.2708 },
  'abu dhabi': { lat: 24.4539, lng: 54.3773 },
  'riyadh': { lat: 24.7136, lng: 46.6753 },
  'istanbul': { lat: 41.0082, lng: 28.9784 },
  'ankara': { lat: 39.9334, lng: 32.8597 },
  'tehran': { lat: 35.6892, lng: 51.389 },
};

// Country name to approximate center coordinates
const COUNTRY_COORDINATES: Record<string, Coordinates> = {
  'usa': { lat: 39.8283, lng: -98.5795 },
  'united states': { lat: 39.8283, lng: -98.5795 },
  'us': { lat: 39.8283, lng: -98.5795 },
  'america': { lat: 39.8283, lng: -98.5795 },
  'russia': { lat: 61.524, lng: 105.3188 },
  'russian federation': { lat: 61.524, lng: 105.3188 },
  'россия': { lat: 61.524, lng: 105.3188 },
  'рф': { lat: 61.524, lng: 105.3188 },
  'ukraine': { lat: 48.3794, lng: 31.1656 },
  'україна': { lat: 48.3794, lng: 31.1656 },
  'belarus': { lat: 53.7098, lng: 27.9534 },
  'беларусь': { lat: 53.7098, lng: 27.9534 },
  'germany': { lat: 51.1657, lng: 10.4515 },
  'deutschland': { lat: 51.1657, lng: 10.4515 },
  'германия': { lat: 51.1657, lng: 10.4515 },
  'france': { lat: 46.2276, lng: 2.2137 },
  'франция': { lat: 46.2276, lng: 2.2137 },
  'uk': { lat: 55.3781, lng: -3.436 },
  'united kingdom': { lat: 55.3781, lng: -3.436 },
  'england': { lat: 52.3555, lng: -1.1743 },
  'великобритания': { lat: 55.3781, lng: -3.436 },
  'italy': { lat: 41.8719, lng: 12.5674 },
  'италия': { lat: 41.8719, lng: 12.5674 },
  'spain': { lat: 40.4637, lng: -3.7492 },
  'испания': { lat: 40.4637, lng: -3.7492 },
  'poland': { lat: 51.9194, lng: 19.1451 },
  'польша': { lat: 51.9194, lng: 19.1451 },
  'canada': { lat: 56.1304, lng: -106.3468 },
  'канада': { lat: 56.1304, lng: -106.3468 },
  'australia': { lat: -25.2744, lng: 133.7751 },
  'австралия': { lat: -25.2744, lng: 133.7751 },
  'israel': { lat: 31.0461, lng: 34.8516 },
  'израиль': { lat: 31.0461, lng: 34.8516 },
  'kazakhstan': { lat: 48.0196, lng: 66.9237 },
  'казахстан': { lat: 48.0196, lng: 66.9237 },
  'uzbekistan': { lat: 41.3775, lng: 64.5853 },
  'узбекистан': { lat: 41.3775, lng: 64.5853 },
  'georgia': { lat: 42.3154, lng: 43.3569 },
  'грузия': { lat: 42.3154, lng: 43.3569 },
  'armenia': { lat: 40.0691, lng: 45.0382 },
  'армения': { lat: 40.0691, lng: 45.0382 },
  'azerbaijan': { lat: 40.1431, lng: 47.5769 },
  'азербайджан': { lat: 40.1431, lng: 47.5769 },
  'latvia': { lat: 56.8796, lng: 24.6032 },
  'латвия': { lat: 56.8796, lng: 24.6032 },
  'lithuania': { lat: 55.1694, lng: 23.8813 },
  'литва': { lat: 55.1694, lng: 23.8813 },
  'estonia': { lat: 58.5953, lng: 25.0136 },
  'эстония': { lat: 58.5953, lng: 25.0136 },
  'moldova': { lat: 47.4116, lng: 28.3699 },
  'молдова': { lat: 47.4116, lng: 28.3699 },
  'ireland': { lat: 53.1424, lng: -7.6921 },
  'ирландия': { lat: 53.1424, lng: -7.6921 },
  'netherlands': { lat: 52.1326, lng: 5.2913 },
  'holland': { lat: 52.1326, lng: 5.2913 },
  'нидерланды': { lat: 52.1326, lng: 5.2913 },
  'belgium': { lat: 50.5039, lng: 4.4699 },
  'бельгия': { lat: 50.5039, lng: 4.4699 },
  'switzerland': { lat: 46.8182, lng: 8.2275 },
  'швейцария': { lat: 46.8182, lng: 8.2275 },
  'austria': { lat: 47.5162, lng: 14.5501 },
  'австрия': { lat: 47.5162, lng: 14.5501 },
  'czech republic': { lat: 49.8175, lng: 15.473 },
  'czechia': { lat: 49.8175, lng: 15.473 },
  'чехия': { lat: 49.8175, lng: 15.473 },
  'hungary': { lat: 47.1625, lng: 19.5033 },
  'венгрия': { lat: 47.1625, lng: 19.5033 },
  'romania': { lat: 45.9432, lng: 24.9668 },
  'румыния': { lat: 45.9432, lng: 24.9668 },
  'bulgaria': { lat: 42.7339, lng: 25.4858 },
  'болгария': { lat: 42.7339, lng: 25.4858 },
  'greece': { lat: 39.0742, lng: 21.8243 },
  'греция': { lat: 39.0742, lng: 21.8243 },
  'turkey': { lat: 38.9637, lng: 35.2433 },
  'турция': { lat: 38.9637, lng: 35.2433 },
  'china': { lat: 35.8617, lng: 104.1954 },
  'китай': { lat: 35.8617, lng: 104.1954 },
  'japan': { lat: 36.2048, lng: 138.2529 },
  'япония': { lat: 36.2048, lng: 138.2529 },
  'korea': { lat: 35.9078, lng: 127.7669 },
  'south korea': { lat: 35.9078, lng: 127.7669 },
  'корея': { lat: 35.9078, lng: 127.7669 },
  'india': { lat: 20.5937, lng: 78.9629 },
  'индия': { lat: 20.5937, lng: 78.9629 },
  'mexico': { lat: 23.6345, lng: -102.5528 },
  'мексика': { lat: 23.6345, lng: -102.5528 },
  'brazil': { lat: -14.235, lng: -51.9253 },
  'бразилия': { lat: -14.235, lng: -51.9253 },
  'argentina': { lat: -38.4161, lng: -63.6167 },
  'аргентина': { lat: -38.4161, lng: -63.6167 },
  'sweden': { lat: 60.1282, lng: 18.6435 },
  'швеция': { lat: 60.1282, lng: 18.6435 },
  'norway': { lat: 60.472, lng: 8.4689 },
  'норвегия': { lat: 60.472, lng: 8.4689 },
  'finland': { lat: 61.9241, lng: 25.7482 },
  'финляндия': { lat: 61.9241, lng: 25.7482 },
  'denmark': { lat: 56.2639, lng: 9.5018 },
  'дания': { lat: 56.2639, lng: 9.5018 },
  'portugal': { lat: 39.3999, lng: -8.2245 },
  'португалия': { lat: 39.3999, lng: -8.2245 },
  'scotland': { lat: 56.4907, lng: -4.2026 },
  'шотландия': { lat: 56.4907, lng: -4.2026 },
  'wales': { lat: 52.1307, lng: -3.7837 },
  'уэльс': { lat: 52.1307, lng: -3.7837 },
  'serbia': { lat: 44.0165, lng: 21.0059 },
  'сербия': { lat: 44.0165, lng: 21.0059 },
  'croatia': { lat: 45.1, lng: 15.2 },
  'хорватия': { lat: 45.1, lng: 15.2 },
  'slovenia': { lat: 46.1512, lng: 14.9955 },
  'словения': { lat: 46.1512, lng: 14.9955 },
  'slovakia': { lat: 48.669, lng: 19.699 },
  'словакия': { lat: 48.669, lng: 19.699 },
};

/**
 * Normalize location string for lookup
 */
function normalizeLocation(location: string): string {
  return location
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?'"()[\]{}]/g, '');
}

/**
 * Extract city name from a location string
 * Handles formats like "Moscow, Russia" or "New York, NY, USA"
 */
function extractCity(location: string): string {
  const parts = location.split(/[,/]/).map((p) => p.trim());
  return parts[0] || location;
}

/**
 * Extract country from a location string
 */
function extractCountry(location: string): string | null {
  const parts = location.split(/[,/]/).map((p) => p.trim());
  if (parts.length >= 2) {
    return parts[parts.length - 1];
  }
  return null;
}

/**
 * Look up coordinates for a location string.
 * Tries city first, then country, returns null if not found.
 */
export function getCoordinates(location: string | null | undefined): Coordinates | null {
  if (!location) return null;

  const normalized = normalizeLocation(location);

  // Try exact match first
  if (CITY_COORDINATES[normalized]) {
    return CITY_COORDINATES[normalized];
  }

  // Try city name extraction
  const city = normalizeLocation(extractCity(location));
  if (CITY_COORDINATES[city]) {
    return CITY_COORDINATES[city];
  }

  // Try country extraction
  const country = extractCountry(location);
  if (country) {
    const normalizedCountry = normalizeLocation(country);
    if (COUNTRY_COORDINATES[normalizedCountry]) {
      return COUNTRY_COORDINATES[normalizedCountry];
    }
  }

  // Try the whole string as country
  if (COUNTRY_COORDINATES[normalized]) {
    return COUNTRY_COORDINATES[normalized];
  }

  // Try to find partial matches in cities
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }

  return null;
}

/**
 * Get display name for a location (normalize and capitalize)
 */
export function getDisplayName(location: string): string {
  return location
    .split(/[,/]/)
    .map((part) =>
      part
        .trim()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    )
    .join(', ');
}

/**
 * Check if coordinates are available for a location
 */
export function hasCoordinates(location: string | null | undefined): boolean {
  return getCoordinates(location) !== null;
}
