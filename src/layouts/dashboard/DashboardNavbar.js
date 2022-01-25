import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
// components
import logo from '../../assets/img/logo.png'
//
import {
  WalletMultiButton as MaterialUIWalletMultiButton,
} from '@solana/wallet-adapter-material-ui';

DashboardNavbar.propTypes = {
  onOpenSidebar: PropTypes.func
};

export default function DashboardNavbar({ onOpenSidebar }) {
  return (
    <div className="page-header">
      <div className="page-header-content">
        <Link to={"/"}>
          <img
            src={logo}
            alt=""
          />
        </Link>
      </div>
      <div>
        <MaterialUIWalletMultiButton />
      </div>
    </div>
  );
}
