import {isNativeFlowsheet, SURROGATE_ID} from '../../services/nativeJobs.service';
import './Graph.css';
import React, { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import demoImage from "../../assets/simple_RO_diagram.png";
import { getDiagram } from "../../services/graph.service"; 

export default function Graph({buildOptions}) {
  let params = useParams();
  const model = params.id === SURROGATE_ID ? 'GRU surrogate' : 'Device physics';
  const connection = buildOptions?.Connection?.value;
  const [ graphImage, setGraphImage ] = useState(null)
  const [ tryAgain, setTryAgain ] = useState(true)
    useEffect(() => {
      
      if (!params.id) {return;}
      setGraphImage(null);

      getDiagram(params.id)
      .then(response => {
      if (response.status === 200) {
          response.blob()
          .then((data)=>{
            if(data.size > 0) {
              setGraphImage(URL.createObjectURL(data))
            }
            else {
              if (tryAgain) setTryAgain(false)
            }
          }).catch((err)=>{
              console.error("error fetching diagram: ",err)
          })
      }
      else {
          console.error("error fetching diagram: ",response.statusText)
      }
      })

    },[tryAgain, params.id, model])

    const noImage = () => {
      return <h1 style={{marginTop:'50px'}}>No Diagram Found</h1>
    }
    return (
      <div id="Graph" className={isNativeFlowsheet(params.id) ? 'airtap-graph' : ''}>
        {graphImage ? 
        <img src={graphImage} alt="flowsheet"/>
         : 
        noImage()}
      </div>
    );

}
