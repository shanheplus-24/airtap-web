import {isNativeFlowsheet} from '../../services/nativeJobs.service';
//import './Page.css';
import React from 'react'; 
import {useEffect, useState, useRef, Fragment } from 'react';
import { useParams } from "react-router-dom";
import { Autocomplete, Alert, Button, Divider, Select, InputLabel, MenuItem, FormControl, Collapse, IconButton, Grid, Box, TextField } from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { selectOption, selectLocation } from '../../services/flowsheet.service';
import capitalLocations from '../../data/capitalLocations.json';


export default function BuildOptions(props) {
    let params = useParams(); 
    const { flowsheetData, tabValue, isBuilt, showBuildOptions, setShowBuildOptions, runBuildFlowsheet, setFlowsheetData } = props
    const [ optionsAreValid, setOptionsAreValid ] = useState({})
    const [ disableBuildButton, setDisableBuildButton ] = useState(false)
    const [nativeBusy, setNativeBusy] = useState(false);
    const [savingOptions, setSavingOptions] = useState(0);
    const optionQueue = useRef(Promise.resolve());
    const queueOptions = save => {
        setSavingOptions(count => count + 1);
        const request = optionQueue.current.catch(() => {}).then(async () => {
            const response = await save();
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Unable to save this option');
            setFlowsheetData({outputData: data.airtap_has_complete_result ? data : null, inputData:data, name:data.name});
            return data;
        });
        optionQueue.current = request.catch(() => {});
        return request.finally(() => setSavingOptions(count => count - 1));
    };
    const commitOption = body => queueOptions(() => selectOption(params.id, body));
    const [locationError, setLocationError] = useState('');
    const [locationRevision, setLocationRevision] = useState(0);
    const [savingLocation, setSavingLocation] = useState(false);
    const options = flowsheetData.inputData.build_options;
    const selectedCapital = capitalLocations.locations.find(location =>
        Math.abs(location.latitude - Number(options.Latitude?.value)) < 1e-6 &&
        Math.abs(location.longitude - Number(options.Longitude?.value)) < 1e-6
    ) || null;
    const chooseCapital = async (_, location) => {
        if (!location) return;
        setLocationError('');
        setSavingLocation(true);
        try {
            await queueOptions(() => selectLocation(params.id, location.latitude, location.longitude));
            setLocationRevision(revision => revision + 1);
            setOptionsAreValid(current => ({...current, Latitude:true, Longitude:true}));
        } catch (error) {
            setLocationError(error.message || 'Unable to save this location');
        } finally {
            setSavingLocation(false);
        }
    };
    const validDate = text => typeof text === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(text) && Number.isFinite(Date.parse(text+'T00:00:00Z')) && new Date(text+'T00:00:00Z').toISOString().slice(0,10)===text;
    const dateRangeInvalid = isNativeFlowsheet(params.id) && (!validDate(options['Start date']?.value) || !validDate(options['End date']?.value) || options['Start date'].value >= options['End date'].value);

    useEffect(() => {
        const changed = event => setNativeBusy(isNativeFlowsheet(params.id) && event.detail?.flowsheet_id === params.id && ['queued','running'].includes(event.detail?.status));
        window.addEventListener('airtap-job-status', changed);
        return () => window.removeEventListener('airtap-job-status', changed);
    }, [params.id]);

    useEffect(() => {
        let tempOptionsAreValid = {}
        for (let key of Object.keys(flowsheetData.inputData.build_options)) {
            tempOptionsAreValid[key] = true
        }
        setOptionsAreValid(tempOptionsAreValid)
    }, [])

    useEffect(() => {
        // console.log('options are valid: ')
        // console.log(optionsAreValid)
        let tempDisableBuildButton = false
        for (let each of Object.keys(optionsAreValid)) {
            if (!optionsAreValid[each]) tempDisableBuildButton = true
        }
        setDisableBuildButton(tempDisableBuildButton)
    }, [optionsAreValid])

    return ( 

    <Box>
        <div style={{display:"flex", justifyContent: "space-between"}} >
        <h3 style={{marginBottom: 5, marginTop:10}}>
            Model Options
            <IconButton disableRipple size="small" sx={{marginTop: -3, marginBottom: -3}} onClick={() => {setShowBuildOptions(!showBuildOptions)}}>
            {showBuildOptions ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
        </h3>
        </div>
        <Divider light sx={{marginBottom:"20px"}}/>
        <Collapse in={showBuildOptions} timeout={0}>
        <Grid container sx={{marginBottom: "50px"}}>
        {isNativeFlowsheet(params.id) ? ['Location', 'Date', 'Optimization', 'Flowsheet'].map(category => (
            <Grid item xs={12} md={6} key={category} sx={{pr:{md:4},pb:2}}>
                <h4 style={{textAlign:'left',margin:'0 0 16px'}}>{category}</h4>
                <Grid container>
                    {category === 'Location' && <Grid item xs={12}>
                        <Autocomplete
                            id="capital-city-select"
                            options={capitalLocations.locations}
                            value={selectedCapital}
                            getOptionLabel={location => `${location.country} — ${location.city}`}
                            isOptionEqualToValue={(option, selected) => option.id === selected.id}
                            onChange={chooseCapital}
                            disableClearable
                            disabled={tabValue!==0 || nativeBusy || savingLocation}
                            autoHighlight
                            noOptionsText="No matching city"
                            ListboxProps={{style:{maxHeight:320}}}
                            sx={{marginBottom:2}}
                            renderInput={field => <TextField {...field} label="City (example)" placeholder="Search by country or city" fullWidth/>}
                        />
                        {locationError && <Alert severity="error" sx={{mb:2}}>{locationError}</Alert>}
                    </Grid>}
                    {Object.entries(flowsheetData.inputData.build_options).filter(([,v]) => v.category===category).map(([k,v]) => (
                        <BuildOption key={category === "Location" ? k+"-"+locationRevision : k} v={v} k={k} params={params} setFlowsheetData={setFlowsheetData} flowsheetData={flowsheetData} disabled={tabValue!==0 || nativeBusy || savingLocation} optionsAreValid={optionsAreValid} setOptionsAreValid={setOptionsAreValid} commitOption={commitOption} datesOutOfOrder={dateRangeInvalid}/>
                    ))}
                </Grid>
            </Grid>
        )) : Object.entries(flowsheetData.inputData.build_options).map(([k,v]) => (
            <BuildOption key={k} v={v} k={k} params={params} setFlowsheetData={setFlowsheetData} flowsheetData={flowsheetData} disabled={tabValue!==0 || nativeBusy || savingLocation} optionsAreValid={optionsAreValid} setOptionsAreValid={setOptionsAreValid} commitOption={commitOption} datesOutOfOrder={dateRangeInvalid}/>
        ))}
        <Grid item xs={6}>
            <div style={{display:"flex"}}>
            <Button 
                id='build-flowsheet-button' 
                size="small" 
                variant="contained" 
                color="primary" 
                sx={{marginLeft: 1}} 
                onClick={runBuildFlowsheet} 
                disabled={tabValue!==0 || disableBuildButton || nativeBusy || savingOptions>0 || dateRangeInvalid}
            >
                {savingOptions>0 ? "Saving options…" : isBuilt ? "Re-build Flowsheet" : "Build Flowsheet"}
            </Button>
            </div>
            
        </Grid>
        <Grid item xs={6}></Grid>
        </Grid>
        </Collapse>
    </Box>
      
    );
  
}
 
function BuildOption(props) {

    const { v, k, params, setFlowsheetData, flowsheetData, disabled, optionsAreValid, setOptionsAreValid, commitOption, datesOutOfOrder } = props;
    
    const [ value,setValue] = useState(v.value)
    const [ isValid, setIsValid ] = useState(true)
    const editing = useRef(false);
    const changeId = useRef(0);
    useEffect(() => { if (!editing.current) setValue(v.value); }, [v.value]);

    const formatOptionType = (option) => {
        try {
          return option.toString()
        } catch(e) {
          return option
        }
      }

      const handleValidity = (valid) => {
        setIsValid(valid)
        setOptionsAreValid(current => ({...current, [k]:valid}));
      }

      const handleUpdateValue = (event, type, min, max) => {
        let body
        const thisChange = ++changeId.current;
        editing.current = true;
        setValue(event.target.value)
        if (type === "int") {
            let newVal
            if (isNaN(event.target.value) || event.target.value === "") {
                handleValidity(false)
                return
            } else {
                newVal = parseInt(event.target.value)
                if (newVal <= max && newVal >= min) {
                    handleValidity(true)
                    body = {option_name: event.target.name, new_option: newVal}
                } else {
                    handleValidity(false)
                    return
                }
                
            }
        }
        else if (type === "float") {
            let newVal
            if (isNaN(event.target.value) || event.target.value === "") {
                handleValidity(false)
                return
            } else {
                newVal = Number(event.target.value)
                if (newVal <= max && newVal >= min) {
                    handleValidity(true)
                    body = {option_name: event.target.name, new_option: newVal}
                } else {
                    handleValidity(false)
                    return
                }
            }
        }
        else if (type === "string") {
            if (isNativeFlowsheet(params.id) && ['Start date','End date'].includes(k)) {
                const text=event.target.value;
                const valid=/^\d{4}-\d{2}-\d{2}$/.test(text) && Number.isFinite(Date.parse(text+'T00:00:00Z')) && new Date(text+'T00:00:00Z').toISOString().slice(0,10)===text;
                handleValidity(valid);
                if (!valid) return;
            }
            body = {option_name: event.target.name, new_option: event.target.value}
        } 
        else {
            body = {option_name: event.target.name, new_option: event.target.value}
        }
        const request = isNativeFlowsheet(params.id) ? commitOption(body) : selectOption(params.id, body).then(response=>response.json());
        request.then(data => {
            if (thisChange === changeId.current) {
                editing.current=false;
                setValue(data.build_options[k].value);
                handleValidity(true);
            }
            if (!isNativeFlowsheet(params.id)) setFlowsheetData({outputData:flowsheetData.outputData,inputData:data,name:data.name});
        }).catch(e => {
            if (thisChange === changeId.current) handleValidity(false);
            console.error('error selecting option: ',e);
        });
      }

    return (
        <Fragment key={k}>
            <Grid item xs={isNativeFlowsheet(params.id) ? 12 : 6}>
                {['int', 'float', 'string'].includes(v.values_allowed) ? 
                    <TextField
                        label={v.display_name}
                        type={isNativeFlowsheet(params.id) && ['Start date','End date'].includes(k) ? 'date' : 'text'}
                        InputLabelProps={isNativeFlowsheet(params.id) && ['Start date','End date'].includes(k) ? {shrink:true} : undefined}
                        helperText={isNativeFlowsheet(params.id) && k==='End date' && datesOutOfOrder ? 'End date must be after start date' : undefined}
                        fullWidth
                        placeholder={['int', 'float'].includes(v.values_allowed) ? `[${v.min_val}-${v.max_val}]` : ''}
                        id={v.values_allowed+"-input-"+k}
                        onChange={(e) => handleUpdateValue(e, v.values_allowed, v.min_val, v.max_val)}
                        value={value}
                        sx={{marginBottom: 2}}
                        name={k}
                        disabled={disabled}
                        error={!isValid || (isNativeFlowsheet(params.id) && k==='End date' && datesOutOfOrder)}
                    />
                    :
                    <FormControl fullWidth sx={{marginBottom: 2}}>
                        <InputLabel id={`${k}_label`}>{v.display_name}</InputLabel>
                        <Select labelId={`${k}_label`} id={`${k}`} label={v.display_name} size="small" 
                            name={k}
                            sx={{textAlign: "left"}}
                            value={value}
                            onChange={handleUpdateValue}
                            disabled={disabled}
                        >
                        {v.values_allowed.map((va, idx) => (
                            <MenuItem key={idx} value={va}>{formatOptionType(va)}</MenuItem>
                        ))}
                        </Select>
                    </FormControl>
                }
            </Grid>
            {!isNativeFlowsheet(params.id) && <Grid item xs={6}></Grid>}
        </Fragment>
    )
}