(function (root, factory) {
    if (typeof define === 'function' && define.amd) {

        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {

        root.CorrelationMatrix = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    function cleanValue(val) {
        if (val === null || val === undefined || val === 'null') return NaN;
        if (typeof val === 'string' && val.includes('@')) return NaN;
        return Number(val);
    }

    function hasEnoughData(dataDict) {
        const columnNames = Object.keys(dataDict);
        let validYears = 0;
        const yearsCount = Math.max(...Object.values(dataDict).map(arr => arr.length));

        for (let year = 0; year < yearsCount; year++) {
            let hasAllData = true;
            for (const key in dataDict) {
                if (isNaN(dataDict[key][year])) {
                    hasAllData = false;
                    break;
                }
            }
            if (hasAllData) validYears++;
            if (validYears >= 2) return true;
        }
        return false;
    }


    function calculatePearsonCorrelation(x, y) {
        const pairs = [];
        for (let i = 0; i < x.length; i++) {
            if (!isNaN(x[i]) && !isNaN(y[i])) {
                pairs.push([x[i], y[i]]);
            }
        }

        if (pairs.length < 2) return NaN;

        const xValues = pairs.map(p => p[0]);
        const yValues = pairs.map(p => p[1]);

        const xMean = xValues.reduce((sum, val) => sum + val, 0) / xValues.length;
        const yMean = yValues.reduce((sum, val) => sum + val, 0) / yValues.length;

        let cov = 0, varX = 0, varY = 0;
        for (let i = 0; i < xValues.length; i++) {
            const xDiff = xValues[i] - xMean;
            const yDiff = yValues[i] - yMean;
            cov += xDiff * yDiff;
            varX += xDiff * xDiff;
            varY += yDiff * yDiff;
        }

        cov /= (xValues.length - 1);
        const stdX = Math.sqrt(varX / (xValues.length - 1));
        const stdY = Math.sqrt(varY / (xValues.length - 1));

        return cov / (stdX * stdY);
    }

    function CorrelationMatrix() {
        if (!(this instanceof CorrelationMatrix)) {
            return new CorrelationMatrix();
        }
    }

    CorrelationMatrix.prototype.calculate = function(rawData) {
        const dataDict = {};
        for (const key in rawData) {
            if (Array.isArray(rawData[key])) {
                dataDict[key] = rawData[key].map(cleanValue);
            }
        }

        const columnNames = Object.keys(dataDict);
        
        if (!hasEnoughData(dataDict)) {
            throw new Error('Недостаточно данных для вычисления корреляционной матрицы. Требуется как минимум 2 наблюдения с полными данными по всем показателям.');
        }

        const matrix = [];
        for (let i = 0; i < columnNames.length; i++) {
            const row = [];
            for (let j = 0; j < columnNames.length; j++) {
                const corr = calculatePearsonCorrelation(
                    dataDict[columnNames[i]], 
                    dataDict[columnNames[j]]
                );
                row.push(isNaN(corr) ? 0 : corr);
            }
            matrix.push(row);
        }

        return {
            matrix: matrix,
            columnNames: columnNames,
            dataDict: dataDict
        };
    };

    CorrelationMatrix.prototype.getDescription = function(value) {
        if (value > 0.7) return 'Сильная положительная корреляция';
        if (value > 0.3) return 'Умеренная положительная корреляция';
        if (value > 0) return 'Слабая положительная корреляция';       
        if (value > -0.3) return 'Слабая отрицательная корреляция';    
        if (value > -0.7) return 'Умеренная отрицательная корреляция'; 
        return 'Сильная отрицательная корреляция';
    };

    return CorrelationMatrix;
}));
