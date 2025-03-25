package org.springframework.samples.pubus.user;

import org.springframework.data.repository.CrudRepository;

public interface JobRepository  extends  CrudRepository<Job, Integer> {
    
}
