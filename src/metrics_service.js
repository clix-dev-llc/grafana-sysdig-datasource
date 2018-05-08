//
//  Copyright 2018 Draios Inc.
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
//
import _ from 'lodash';
import ApiService from './api_service';

export default class MetricsService {
    static findMetrics(backend) {
        if (metricsCache.isValid()) {
            return backend.backendSrv.$q.when(metricsCache.data);
        } else if (metricsCache.isLoading()) {
            return metricsCache.promise;
        } else {
            return metricsCache.load(
                ApiService.send(backend, {
                    url: 'api/data/metrics?light=true'
                })
                    .then((result) => {
                        const plottableMetricTypes = [
                            '%',
                            'byte',
                            'date',
                            'int',
                            'number',
                            'relativeTime'
                        ];

                        return Object.values(result.data)
                            .map((m) =>
                                _.assign(m, {
                                    isNumeric: plottableMetricTypes.indexOf(m.type) >= 0
                                })
                            )
                            .filter((m) => {
                                return m.isNumeric;
                            })
                            .sort((a, b) => a.id.localeCompare(b.id));
                    })
                    .then((data) => {
                        metricsCache.setData(data);

                        return data;
                    })
            );
        }
    }

    static findSegmentations(backend, metric) {
        if (metric) {
            return ApiService.send(backend, {
                url: `api/data/metrics/${metric}/segmentationMetrics`
            }).then((result) => {
                return result.data.segmentationMetrics.sort((a, b) => a.localeCompare(b));
            });
        } else {
            return backend.backendSrv.$q.when([]);
        }
    }
}

const metricsCache = {
    timestamp: null,
    data: null,
    promise: null,
    load(promise) {
        this.promise = promise;
        return promise;
    },
    setData(data) {
        this.timestamp = Date.now();
        this.data = data;
        this.promise = null;
    },
    isLoading() {
        return this.isValid() === false && this.promise !== null;
    },
    isValid() {
        return this.timestamp !== null && this.timestamp >= Date.now() - 60000;
    }
};