import useRouteElements from './hook/useElementRoute';
import { ToastContainer } from 'react-toastify';
import './styles/reset.css';

function App() {
  const routeElements = useRouteElements();
  return (
    <div>
      {routeElements}
      <ToastContainer position='top-right' autoClose={500} theme='colored' />
    </div>
  );
}

export default App;
