import React from 'react';
import Container from './Container';
import SearchResults from './SearchResults';

const ResultsBar = ({ numResults }) => (
  <Container>
    <div className="flex -mx-4">
      <div className="w-3/5 ml-auto mr-auto px-8 py-4">
        <div className="flex items-center">
          <span className="text-grey-dark italic font-light">Showing {numResults} results</span>
          <div className="ml-auto hidden">
            <i className="fas fa-bars text-blue-dark mr-2" />
            <i className="fas fa-th text-grey" />
          </div>
        </div>
      </div>
    </div>
  </Container>
);

const ResultsBody = ({ results }) => (
  <Container>
    <div className="flex -mx-4">
      <div className="w-3/5 mx-auto px-4">
        <div className="flex flex-col rounded text-sm shadow p-4 mb-6">
          <SearchResults results={results} />
        </div>
      </div>
    </div>
  </Container>
);

const Content = ({ results }) => (
  <div>
    <ResultsBar numResults={results.length} />
    <ResultsBody results={results} />
  </div>
);

export default Content;
