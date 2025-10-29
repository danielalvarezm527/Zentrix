import logo from './logo.svg';
import './App.css';
import AddDoc from './components/add_doc';
import GetDocs from './components/get_docs';
import GetDoc from './components/get_doc';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <input placeholder="address" id="address"></input>
        <input placeholder="company_name" id="company_name"></input>
        <input placeholder="email" id="email"></input>
        <input placeholder="nit" id="nit"></input>
        <button onClick={AddDoc} className='button-input'>Enviara a firebase</button>

        <br></br>

        <button onClick={GetDocs} className='button-input'>Traer de firebase</button>

        <br></br>

        <input placeholder="id documento" id="docId"></input>
        <button onClick={GetDoc} className='button-input'>Traer de firebase uno especifico</button>
      </header>
    </div>
  );
}

export default App;
